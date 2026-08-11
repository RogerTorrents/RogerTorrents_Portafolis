import { Component, computed, inject } from '@angular/core';
import { GeoExplorerService } from '../../services/geoexplorer.service';
import { TraduccioService } from '../../services/traduccio.service';
import { esLlac, esParking, esPic, esRefugi, type Poi } from '../../models/poi.model';

@Component({
  selector: 'app-detall-poi',
  standalone: true,
  templateUrl: './detall-poi.html',
  styleUrl: './detall-poi.css',
})
export class DetallPoi {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);

  protected readonly esPic = esPic;
  protected readonly esRefugi = esRefugi;
  protected readonly esLlac = esLlac;
  protected readonly esParking = esParking;

  protected readonly urlGoogleMaps = computed(() => {
    const poi = this.geo.poiSeleccionat();
    if (!poi) return '';
    const [lat, lng] = poi.coordenades;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  });

  tancar(): void {
    this.geo.seleccionarPoi(null);
  }

  iconaCategoria(poi: Poi): string {
    const icones: Record<Poi['tipus'], string> = { pic: '▲', refugi: '⌂', llac: '≈', parking: 'P' };
    return icones[poi.tipus];
  }
}
