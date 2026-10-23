import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject, signal } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { GeoExplorerService, type CapaBase } from '../../services/geoexplorer.service';
import { ContingutPersonalService } from '../../services/contingut-personal.service';
import { DispositiuService } from '../../services/dispositiu.service';
import { TraduccioService } from '../../services/traduccio.service';
import { creaIconaCercada, creaIconaLlocPersonal, creaIconaPoi } from '../../services/mapa-icones.util';
import type { Poi } from '../../models/poi.model';
import type { LlocPersonal } from '../../models/lloc-personal.model';
import type { CategoriaPersonal } from '../../models/categoria-personal.model';

/**
 * `leaflet.markercluster` s'enganxa al `L` global (`window.L`). En el build de
 * producció, `import * as L` és una còpia del mòdul feta per l'empaquetador i
 * no hi veu `markerClusterGroup`, així que també el busquem al global.
 */
const markerClusterGroup: typeof L.markerClusterGroup =
  L.markerClusterGroup ?? (globalThis as unknown as { L: typeof L }).L.markerClusterGroup;

interface DefinicioCapaBase {
  readonly url: string;
  readonly atribucio: string;
  readonly zoomMax: number;
}

const CAPES_BASE: Record<CapaBase, DefinicioCapaBase> = {
  topografic: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    atribucio: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
    zoomMax: 17,
  },
  satelit: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    atribucio: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    zoomMax: 19,
  },
  estandard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    atribucio: '© OpenStreetMap contributors',
    zoomMax: 19,
  },
};

/**
 * Component encapsulador de Leaflet. No conté lògica de negoci: llegeix
 * l'estat de `GeoExplorerService` via signals i el reflecteix al mapa.
 */
@Component({
  selector: 'app-mapa',
  standalone: true,
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa implements AfterViewInit, OnDestroy {
  @ViewChild('contenidorMapa', { static: true }) private readonly contenidorMapa!: ElementRef<HTMLDivElement>;

  protected readonly geo = inject(GeoExplorerService);
  protected readonly contingut = inject(ContingutPersonalService);
  protected readonly dispositiu = inject(DispositiuService);
  protected readonly ts = inject(TraduccioService);

  /** Botó "La meva ubicació" (només tàctil, vegeu mapa.css). */
  protected readonly localitzant = signal(false);
  protected readonly errorUbicacio = signal(false);
  private errorUbicacioTimeout?: ReturnType<typeof setTimeout>;

  private mapa: L.Map | null = null;
  private capaActiva: L.TileLayer | null = null;
  private readonly grupClusters = markerClusterGroup({
    // `chunkedLoading` trenca l'alta d'un lot gran de marcadors (100+ POIs)
    // en petits blocs via requestAnimationFrame, en lloc de bloquejar el fil
    // principal sencer d'un cop — evita que el mapa es "congeli" un instant
    // en canviar de filtre.
    chunkedLoading: true,
    chunkInterval: 50,
    chunkDelay: 20,
    iconCreateFunction: (cluster) =>
      L.divIcon({
        className: '',
        html: `<div class="geo-cluster-icona" style="width:38px;height:38px">${cluster.getChildCount()}</div>`,
        iconSize: [38, 38],
      }),
  });
  private readonly grupLlocsPersonals = L.layerGroup();
  private readonly marcadorsPersonalsPerId = new Map<string, L.Marker>();
  private marcadorCercat: L.Marker | null = null;

  constructor() {
    effect(() => {
      const capa = this.geo.capaBase();
      this.aplicarCapaBase(capa);
    });

    effect(() => {
      const regio = this.geo.regioActiva();
      if (!this.mapa) return;
      this.mapa.flyTo(regio.centre as [number, number], regio.zoom, { duration: 0.8 });
    });

    effect(() => {
      const pois = this.geo.poisFiltrats();
      this.dibuixarMarcadors(pois);
    });

    effect(() => {
      const llocs = this.contingut.llocsVisibles();
      const categories = this.contingut.categories();
      this.dibuixarLlocsPersonals(llocs, categories);
    });

    effect(() => {
      const enColocacio = this.contingut.enModeColocacio();
      this.mapa?.getContainer().classList.toggle('geo-cursor-colocacio', enColocacio);
    });

    effect(() => {
      const lloc = this.contingut.llocEnfocat();
      if (!lloc || !this.mapa) return;
      const zoomActual = this.mapa.getZoom();
      this.mapa.flyTo(lloc.coordenades as [number, number], Math.max(zoomActual, 14), { duration: 0.8 });
      this.marcadorsPersonalsPerId.get(lloc.id)?.openTooltip();
    });

    // Mòbil (full inferior de detall): en obrir un punt, el mapa hi vola i el
    // deixa a la meitat de dalt, que és la part que el full no tapa. A
    // escriptori el detall és un panell lateral i no cal moure res.
    effect(() => {
      const poi = this.geo.poiSeleccionat();
      if (!poi || !this.mapa || !this.esFullInferior()) return;
      const zoom = Math.max(this.mapa.getZoom(), 13);
      const alcada = this.mapa.getSize().y;
      const punt = this.mapa.project(poi.coordenades as [number, number], zoom).add([0, alcada * 0.25]);
      this.mapa.flyTo(this.mapa.unproject(punt, zoom), zoom, { duration: 0.7 });
    });

    effect(() => {
      const coordenades = this.geo.coordenadesCercades();
      if (!coordenades || !this.mapa) return;
      this.mapa.flyTo(coordenades as [number, number], Math.max(this.mapa.getZoom(), 15), { duration: 0.8 });
      this.marcadorCercat?.remove();
      this.marcadorCercat = L.marker(coordenades as [number, number], { icon: creaIconaCercada(), zIndexOffset: 1000 }).addTo(this.mapa);
      this.marcadorCercat.bindTooltip(`${coordenades[0].toFixed(5)}, ${coordenades[1].toFixed(5)}`, { direction: 'top', offset: [0, -12] });
    });
  }

  ngAfterViewInit(): void {
    const regioInicial = this.geo.regioActiva();
    this.mapa = L.map(this.contenidorMapa.nativeElement, {
      center: regioInicial.centre as [number, number],
      zoom: regioInicial.zoom,
      maxZoom: 19,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(this.mapa);
    // La capa base s'ha d'afegir abans que el grup de clústers: Leaflet
    // necessita almenys una capa amb `maxZoom` present al mapa per calcular
    // el zoom màxim intern; si no, llença "Map has no maxZoom specified".
    this.aplicarCapaBase(this.geo.capaBase());
    this.grupClusters.addTo(this.mapa);
    this.grupLlocsPersonals.addTo(this.mapa);
    this.dibuixarMarcadors(this.geo.poisFiltrats());

    this.mapa.on('click', (event: L.LeafletMouseEvent) => {
      if (!this.contingut.enModeColocacio()) return;
      this.contingut.registrarClicMapa([event.latlng.lat, event.latlng.lng]);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.errorUbicacioTimeout);
    this.mapa?.remove();
  }

  /** Centra el mapa a la posició del dispositiu, amb el mateix marcador que
   *  la cerca per coordenades. Dins el Shell cal `allow="geolocation"` a
   *  l'iframe. */
  protected ubicar(): void {
    if (this.localitzant()) return;
    if (!('geolocation' in navigator)) {
      this.mostrarErrorUbicacio();
      return;
    }
    this.localitzant.set(true);
    navigator.geolocation.getCurrentPosition(
      posicio => {
        this.localitzant.set(false);
        this.geo.cercarCoordenades([posicio.coords.latitude, posicio.coords.longitude]);
      },
      () => {
        this.localitzant.set(false);
        this.mostrarErrorUbicacio();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  private mostrarErrorUbicacio(): void {
    this.errorUbicacio.set(true);
    clearTimeout(this.errorUbicacioTimeout);
    this.errorUbicacioTimeout = setTimeout(() => this.errorUbicacio.set(false), 3500);
  }

  /** El detall s'obre com a full inferior: tàctil i pantalla estreta. */
  private esFullInferior(): boolean {
    return this.dispositiu.tactil() && window.matchMedia('(max-width: 720px)').matches;
  }

  private aplicarCapaBase(capa: CapaBase): void {
    if (!this.mapa) return;
    const def = CAPES_BASE[capa];
    if (this.capaActiva) this.mapa.removeLayer(this.capaActiva);
    this.capaActiva = L.tileLayer(def.url, { attribution: def.atribucio, maxZoom: def.zoomMax, subdomains: 'abc' });
    this.capaActiva.addTo(this.mapa);
  }

  private dibuixarMarcadors(pois: readonly Poi[]): void {
    // Es construeix l'array sencer i es passa a `addLayers` (API en plural
    // de leaflet.markercluster) en lloc de cridar `addLayer` marcador a
    // marcador: amb 100+ punts, `addLayers` recalcula els clústers un cop
    // per al lot sencer en lloc d'un cop per marcador afegit, molt més ràpid.
    this.grupClusters.clearLayers();
    const marcadors = pois.map(poi => {
      const marcador = L.marker(poi.coordenades as [number, number], { icon: creaIconaPoi(poi) });
      marcador.on('click', () => {
        this.contingut.seleccionarLloc(null);
        this.geo.seleccionarPoi(poi);
      });
      marcador.bindTooltip(poi.nom, { direction: 'top', offset: [0, -26] });
      return marcador;
    });
    this.grupClusters.addLayers(marcadors);
  }

  private dibuixarLlocsPersonals(llocs: readonly LlocPersonal[], categories: readonly CategoriaPersonal[]): void {
    this.grupLlocsPersonals.clearLayers();
    this.marcadorsPersonalsPerId.clear();
    for (const lloc of llocs) {
      const categoria = categories.find(c => c.id === lloc.categoriaId);
      if (!categoria) continue;
      const marcador = L.marker(lloc.coordenades as [number, number], { icon: creaIconaLlocPersonal(categoria) });
      marcador.on('click', () => {
        this.geo.seleccionarPoi(null);
        this.contingut.seleccionarLloc(lloc);
      });
      marcador.bindTooltip(lloc.nom, { direction: 'top', offset: [0, -14] });
      this.grupLlocsPersonals.addLayer(marcador);
      this.marcadorsPersonalsPerId.set(lloc.id, marcador);
    }
  }
}
