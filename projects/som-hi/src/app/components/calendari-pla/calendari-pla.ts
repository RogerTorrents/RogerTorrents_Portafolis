import { Component, computed, inject, input, output } from '@angular/core';
import type { AssignacioAmbEntrenament } from '../../models/assignacio.model';
import type { PlaAmbProgres } from '../../models/pla.model';
import { afegirDiesISO, avuiISO, dataFiPla, indexDiaSetmana } from '../../services/data.util';
import { TraduccioService } from '../../services/traduccio.service';

interface DiaGraella {
  readonly data: string;
  readonly assignacions: readonly AssignacioAmbEntrenament[];
}

@Component({
  selector: 'app-calendari-pla',
  standalone: true,
  templateUrl: './calendari-pla.html',
  styleUrl: './calendari-pla.css',
})
export class CalendariPla {
  protected readonly ts = inject(TraduccioService);

  readonly pla = input.required<PlaAmbProgres>();
  readonly assignacions = input.required<readonly AssignacioAmbEntrenament[]>();
  readonly obrirDia = output<string>();

  protected readonly avui = avuiISO();
  protected readonly etiquetesDies = ['dia_dl', 'dia_dt', 'dia_dc', 'dia_dj', 'dia_dv', 'dia_ds', 'dia_dg'];

  /**
   * Graella alineada al calendari real (columnes = dilluns..diumenge de
   * veritat), no "7 dies consecutius des de dataInici" — si el pla comença
   * un dijous, la primera setmana té 3 caselles buides (dl-dc) abans que
   * comenci el pla, i el dijous real cau sota la columna "Dj", no sota "Dl".
   * Bug real corregit: abans les caselles s'etiquetaven per POSICIÓ (d=0
   * sempre "Dl") en lloc de pel dia de la setmana real de cada data, així
   * que un entrenament assignat "cada dilluns" podia aparèixer visualment
   * sota qualsevol altra columna segons quin dia de la setmana queia
   * `dataInici`.
   */
  protected readonly setmanes = computed<readonly (readonly (DiaGraella | null)[])[]>(() => {
    const pla = this.pla();
    const perData = new Map<string, AssignacioAmbEntrenament[]>();
    for (const a of this.assignacions()) {
      const llista = perData.get(a.data) ?? [];
      llista.push(a);
      perData.set(a.data, llista);
    }

    const dataFi = dataFiPla(pla.dataInici, pla.durationSetmanes);
    const inicGraella = afegirDiesISO(pla.dataInici, -indexDiaSetmana(pla.dataInici));
    const fiGraella = afegirDiesISO(dataFi, 6 - indexDiaSetmana(dataFi));

    const setmanes: (DiaGraella | null)[][] = [];
    let cursor = inicGraella;
    while (cursor <= fiGraella) {
      const setmana: (DiaGraella | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const dinsDelPla = cursor >= pla.dataInici && cursor <= dataFi;
        setmana.push(dinsDelPla ? { data: cursor, assignacions: perData.get(cursor) ?? [] } : null);
        cursor = afegirDiesISO(cursor, 1);
      }
      setmanes.push(setmana);
    }
    return setmanes;
  });
}
