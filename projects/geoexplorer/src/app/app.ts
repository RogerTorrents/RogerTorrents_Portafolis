import { Component, effect, inject, signal } from '@angular/core';
import { Capcalera } from './components/capcalera/capcalera';
import { PanellFiltres } from './components/panell-filtres/panell-filtres';
import { LlistaResultats } from './components/llista-resultats/llista-resultats';
import { Mapa } from './components/mapa/mapa';
import { DetallPoi } from './components/detall-poi/detall-poi';
import { DetallLlocPersonal } from './components/detall-lloc-personal/detall-lloc-personal';
import { PantallaEntrada } from './components/pantalla-entrada/pantalla-entrada';
import { FormulariLogin } from './components/formulari-login/formulari-login';
import { FormulariRegistre } from './components/formulari-registre/formulari-registre';
import { PanellCategoriesPersonals } from './components/panell-categories-personals/panell-categories-personals';
import { FormulariLlocPersonal } from './components/formulari-lloc-personal/formulari-lloc-personal';
import { ConfirmacioDialeg } from './components/confirmacio-dialeg/confirmacio-dialeg';
import { EliminarCompteDialeg } from './components/eliminar-compte-dialeg/eliminar-compte-dialeg';
import { GeoExplorerService, type CapaBase } from './services/geoexplorer.service';
import { TraduccioService } from './services/traduccio.service';
import { SessioService } from './services/sessio.service';
import { ContingutPersonalService } from './services/contingut-personal.service';
import { DispositiuService } from './services/dispositiu.service';
import type { Regio } from './models/regio.model';

const CLAU_STORAGE_AMPLARIA = 'geoexplorer_amplaria_lateral';
const AMPLARIA_MINIMA = 260;
const AMPLARIA_MAXIMA = 560;
const AMPLARIA_PER_DEFECTE = 320;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Capcalera,
    PanellFiltres,
    LlistaResultats,
    Mapa,
    DetallPoi,
    DetallLlocPersonal,
    PantallaEntrada,
    FormulariLogin,
    FormulariRegistre,
    PanellCategoriesPersonals,
    FormulariLlocPersonal,
    ConfirmacioDialeg,
    EliminarCompteDialeg,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);
  protected readonly sessio = inject(SessioService);
  protected readonly contingut = inject(ContingutPersonalService);
  protected readonly dispositiu = inject(DispositiuService);

  protected readonly capes: readonly CapaBase[] = ['topografic', 'satelit', 'estandard'];

  protected readonly amplariaLateral = signal(this.carregarAmplariaGuardada());
  private redimensionant = false;

  constructor() {
    // Mòbil: el full inferior (filtres / el meu mapa) tapa el mapa. Quan
    // l'usuari fa una acció que s'ha de veure al mapa — obrir un punt,
    // enfocar un lloc propi o començar a col·locar-ne un de nou (cal tocar
    // el mapa!) — el full es tanca sol. Només en tàctil: a escriptori el
    // panell lateral mai tapa el mapa.
    effect(() => {
      const calVeureElMapa =
        this.geo.poiSeleccionat() !== null ||
        this.contingut.llocEnfocat() !== null ||
        this.contingut.enModeColocacio();
      if (calVeureElMapa && this.dispositiu.tactil()) this.geo.filtresObertsMobil.set(false);
    });
  }

  /** Selectors de zona i mapa base dins el full inferior (només mòbil: a la
   *  capçalera no hi caben). Canviar de zona tanca el full per veure el vol. */
  protected onCanviRegioMobil(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const regio = this.geo.regions.find((r: Regio) => r.id === id);
    if (!regio) return;
    this.geo.canviarRegio(regio);
    this.geo.filtresObertsMobil.set(false);
  }

  protected onCanviCapaMobil(event: Event): void {
    this.geo.canviarCapaBase((event.target as HTMLSelectElement).value as CapaBase);
  }

  onResizerPointerDown(event: PointerEvent): void {
    this.redimensionant = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  onResizerPointerMove(event: PointerEvent): void {
    if (!this.redimensionant) return;
    const nova = Math.min(AMPLARIA_MAXIMA, Math.max(AMPLARIA_MINIMA, event.clientX));
    this.amplariaLateral.set(nova);
  }

  onResizerPointerUp(): void {
    if (!this.redimensionant) return;
    this.redimensionant = false;
    localStorage.setItem(CLAU_STORAGE_AMPLARIA, String(this.amplariaLateral()));
  }

  private carregarAmplariaGuardada(): number {
    const valor = Number(localStorage.getItem(CLAU_STORAGE_AMPLARIA));
    if (!Number.isFinite(valor) || valor <= 0) return AMPLARIA_PER_DEFECTE;
    return Math.min(AMPLARIA_MAXIMA, Math.max(AMPLARIA_MINIMA, valor));
  }
}
