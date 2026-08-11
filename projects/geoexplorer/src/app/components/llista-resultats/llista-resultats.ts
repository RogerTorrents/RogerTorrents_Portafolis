import { Component, inject } from '@angular/core';
import { GeoExplorerService } from '../../services/geoexplorer.service';
import { TraduccioService } from '../../services/traduccio.service';
import { altitudDe, type Poi, type TipusPoi } from '../../models/poi.model';

@Component({
  selector: 'app-llista-resultats',
  standalone: true,
  templateUrl: './llista-resultats.html',
  styleUrl: './llista-resultats.css',
})
export class LlistaResultats {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);

  protected iconaCategoria(categoria: TipusPoi): string {
    const icones: Record<TipusPoi, string> = { pic: '▲', refugi: '⌂', llac: '≈', parking: 'P' };
    return icones[categoria];
  }

  protected altitud(poi: Poi): number | null {
    return altitudDe(poi);
  }

  trackPoi(_index: number, poi: Poi): string {
    return poi.id;
  }
}
