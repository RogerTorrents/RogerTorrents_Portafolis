import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { REGIONS } from '../data/regions.data';
import { filtresPerDefecte, type FiltresEstat } from '../models/filtres.model';
import { altitudDe, type Coordenades, type Dificultat, type Poi, type TipusPoi } from '../models/poi.model';
import type { Regio } from '../models/regio.model';
import { SessioService } from './sessio.service';

export type CapaBase = 'topografic' | 'satelit' | 'estandard';

/**
 * Estat central de GeoExplorer: regió activa, capa base, filtres i selecció.
 * Tots els components consulten aquest servei via signals — sense router,
 * seguint el mateix patró d'estat centralitzat de `JocService` a joc-impostor.
 *
 * El contingut oficial/curat (`totsElsPois`) es carrega de `GET /pois` a
 * `geoexplorer-api` en construir el servei, no d'un fitxer estàtic.
 *
 * La `regioActiva` NOMÉS controla l'enquadrament del mapa (`flyTo` a
 * `Mapa`) — mai filtra quins punts es veuen. Filtrar per regió barrejava dos
 * conceptes diferents (on estic mirant / què vull veure) i feia que els
 * punts apareguessin i desapareguessin en canviar de zona, cosa confusa.
 */
@Injectable({ providedIn: 'root' })
export class GeoExplorerService {
  private readonly http = inject(HttpClient);
  private readonly sessio = inject(SessioService);

  readonly regions: readonly Regio[] = REGIONS;

  readonly regioActiva = signal<Regio>(REGIONS[0]);
  readonly capaBase = signal<CapaBase>('topografic');
  readonly filtres = signal<FiltresEstat>(filtresPerDefecte());
  readonly poiSeleccionat = signal<Poi | null>(null);
  readonly filtresObertsMobil = signal(false);
  readonly carregantPois = signal(true);

  /**
   * Visibilitat del contingut oficial/curat. Els usuaris autenticats hi
   * entren amb el seu mapa personal com a protagonista i el contingut
   * oficial amagat per defecte (es pot activar amb un sol interruptor); els
   * convidats el veuen sempre.
   */
  readonly mostrarPoisOficials = signal(true);

  /** Darrera cerca per coordenades (`Capcalera`). `Mapa` hi fa `flyTo` i hi dibuixa un marcador. */
  readonly coordenadesCercades = signal<Coordenades | null>(null);

  private readonly totsElsPois = signal<readonly Poi[]>([]);

  constructor() {
    this.http.get<Poi[]>(`${environment.apiUrl}/pois`).subscribe({
      next: pois => {
        this.totsElsPois.set(pois);
        this.carregantPois.set(false);
      },
      error: () => this.carregantPois.set(false),
    });

    effect(() => {
      this.mostrarPoisOficials.set(!this.sessio.esAutenticat());
    });
  }

  readonly poisFiltrats = computed(() => {
    if (!this.mostrarPoisOficials()) return [];

    const f = this.filtres();
    const cerca = f.cercaText.trim().toLowerCase();

    return this.totsElsPois().filter(poi => {
      if (!f.categories.has(poi.tipus)) return false;
      if (cerca && !poi.nom.toLowerCase().includes(cerca)) return false;

      const altitud = altitudDe(poi);
      if (altitud !== null && (altitud < f.altitudMin || altitud > f.altitudMax)) return false;

      if (poi.tipus === 'pic' && !f.dificultats.has(poi.dificultat)) return false;

      return true;
    });
  });

  canviarRegio(regio: Regio): void {
    this.regioActiva.set(regio);
    this.poiSeleccionat.set(null);
  }

  canviarCapaBase(capa: CapaBase): void {
    this.capaBase.set(capa);
  }

  seleccionarPoi(poi: Poi | null): void {
    this.poiSeleccionat.set(poi);
  }

  cercarCoordenades(coordenades: Coordenades): void {
    this.coordenadesCercades.set(coordenades);
    this.poiSeleccionat.set(null);
  }

  actualitzarCerca(text: string): void {
    this.filtres.update(f => ({ ...f, cercaText: text }));
  }

  alternarCategoria(categoria: TipusPoi): void {
    this.filtres.update(f => {
      const categories = new Set(f.categories);
      categories.has(categoria) ? categories.delete(categoria) : categories.add(categoria);
      return { ...f, categories };
    });
  }

  alternarDificultat(dificultat: Dificultat): void {
    this.filtres.update(f => {
      const dificultats = new Set(f.dificultats);
      dificultats.has(dificultat) ? dificultats.delete(dificultat) : dificultats.add(dificultat);
      return { ...f, dificultats };
    });
  }

  actualitzarRangAltitud(min: number, max: number): void {
    this.filtres.update(f => ({ ...f, altitudMin: min, altitudMax: max }));
  }

  netejarFiltres(): void {
    this.filtres.set(filtresPerDefecte());
  }

  alternarFiltresMobil(): void {
    this.filtresObertsMobil.update(v => !v);
  }

  alternarMostrarPoisOficials(): void {
    this.mostrarPoisOficials.update(v => !v);
  }
}
