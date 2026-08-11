import { Component, inject, signal } from '@angular/core';
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
import { GeoExplorerService } from './services/geoexplorer.service';
import { TraduccioService } from './services/traduccio.service';
import { SessioService } from './services/sessio.service';

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
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);
  protected readonly sessio = inject(SessioService);

  protected readonly amplariaLateral = signal(this.carregarAmplariaGuardada());
  private redimensionant = false;

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
