import { Component, effect, inject, signal } from '@angular/core';
import { GeoExplorerService } from '../../services/geoexplorer.service';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';
import { ALTITUD_ABSOLUTA_MAX, ALTITUD_ABSOLUTA_MIN, TOTES_LES_CATEGORIES, TOTES_LES_DIFICULTATS } from '../../models/filtres.model';
import type { Dificultat, TipusPoi } from '../../models/poi.model';

@Component({
  selector: 'app-panell-filtres',
  standalone: true,
  templateUrl: './panell-filtres.html',
  styleUrl: './panell-filtres.css',
})
export class PanellFiltres {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);
  protected readonly sessio = inject(SessioService);

  protected readonly categories = TOTES_LES_CATEGORIES;
  protected readonly dificultats = TOTES_LES_DIFICULTATS;

  protected readonly altitudAbsMin = ALTITUD_ABSOLUTA_MIN;
  protected readonly altitudAbsMax = ALTITUD_ABSOLUTA_MAX;

  /** Valor mostrat a l'etiqueta/slider a l'instant (sense debounce), separat
   * del valor real dels filtres (amb debounce) — així el número i la
   * posició del slider responen a cada frame mentre s'arrossega, però el
   * redibuixat dels 100+ marcadors del mapa no es dispara en cada pixel. */
  protected readonly altitudMinMostrat = signal(this.geo.filtres().altitudMin);
  protected readonly altitudMaxMostrat = signal(this.geo.filtres().altitudMax);
  private altitudDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const f = this.geo.filtres();
      this.altitudMinMostrat.set(f.altitudMin);
      this.altitudMaxMostrat.set(f.altitudMax);
    });
  }

  protected iconaCategoria(categoria: TipusPoi): string {
    const icones: Record<TipusPoi, string> = { pic: '▲', refugi: '⌂', llac: '≈', parking: 'P' };
    return icones[categoria];
  }

  protected categoriaActiva(categoria: TipusPoi): boolean {
    return this.geo.filtres().categories.has(categoria);
  }

  protected mostrarFiltreAltitud(): boolean {
    const cat = this.geo.filtres().categories;
    return cat.has('pic') || cat.has('refugi') || cat.has('llac');
  }

  protected mostrarFiltreDificultat(): boolean {
    return this.geo.filtres().categories.has('pic');
  }

  /** Contingut de filtres (categoria/altitud/dificultat): sempre per a convidats;
   * per a autenticats, només quan el contingut oficial és visible. */
  protected mostrarContingutFiltres(): boolean {
    return !this.sessio.esAutenticat() || this.geo.mostrarPoisOficials();
  }

  onAltitudMinInput(event: Event): void {
    const min = Number((event.target as HTMLInputElement).value);
    this.altitudMinMostrat.set(min);
    this.debounceActualitzarAltitud(min, this.altitudMaxMostrat());
  }

  onAltitudMaxInput(event: Event): void {
    const max = Number((event.target as HTMLInputElement).value);
    this.altitudMaxMostrat.set(max);
    this.debounceActualitzarAltitud(this.altitudMinMostrat(), max);
  }

  private debounceActualitzarAltitud(min: number, max: number): void {
    clearTimeout(this.altitudDebounce);
    this.altitudDebounce = setTimeout(() => this.geo.actualitzarRangAltitud(min, max), 120);
  }

  trackDificultat(_index: number, d: Dificultat): Dificultat {
    return d;
  }
}
