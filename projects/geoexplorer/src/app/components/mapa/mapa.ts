import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, inject } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { GeoExplorerService, type CapaBase } from '../../services/geoexplorer.service';
import { ContingutPersonalService } from '../../services/contingut-personal.service';
import { creaIconaCercada, creaIconaLlocPersonal, creaIconaPoi } from '../../services/mapa-icones.util';
import type { Poi } from '../../models/poi.model';
import type { LlocPersonal } from '../../models/lloc-personal.model';
import type { CategoriaPersonal } from '../../models/categoria-personal.model';

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

  private mapa: L.Map | null = null;
  private capaActiva: L.TileLayer | null = null;
  private readonly grupClusters = L.markerClusterGroup({
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
    this.mapa?.remove();
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
