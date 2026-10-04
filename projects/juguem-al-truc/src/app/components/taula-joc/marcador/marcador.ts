import { Component, computed, input } from '@angular/core';
import { ResultatRonda } from '../../../models/joc.model';
import { Equip } from '../../../models/personatge.model';

/** Estat visual d'un dels 3 punts de ronda del marcador, des del punt de vista de `elMeuEquip`. */
export type EstatRonda = 'guanyada' | 'empat' | 'perduda' | 'pendent';

const RONDES_PER_MA = 3;

@Component({
  selector: 'app-marcador',
  imports: [],
  templateUrl: './marcador.html',
  styleUrl: './marcador.css',
})
export class Marcador {
  readonly puntsA = input.required<number>();
  readonly puntsB = input.required<number>();
  readonly nomEquipA = input.required<string>();
  readonly nomEquipB = input.required<string>();
  readonly elMeuEquip = input<Equip | null>(null);
  readonly valorAposta = input<1 | 2 | 3>(1);
  readonly historialRondes = input<readonly ResultatRonda[]>([]);

  protected readonly rondes = computed<readonly EstatRonda[]>(() => {
    const historial = this.historialRondes();
    const meu = this.elMeuEquip();
    return Array.from({ length: RONDES_PER_MA }, (_, i): EstatRonda => {
      const resultat = historial[i];
      if (resultat === undefined) return 'pendent';
      if (resultat === 'empat') return 'empat';
      return resultat === meu ? 'guanyada' : 'perduda';
    });
  });
}
