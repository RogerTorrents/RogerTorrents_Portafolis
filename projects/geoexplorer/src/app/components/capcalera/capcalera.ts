import { Component, inject, signal } from '@angular/core';
import { GeoExplorerService, type CapaBase } from '../../services/geoexplorer.service';
import { TraduccioService } from '../../services/traduccio.service';
import { SessioService } from '../../services/sessio.service';
import type { Regio } from '../../models/regio.model';

@Component({
  selector: 'app-capcalera',
  standalone: true,
  templateUrl: './capcalera.html',
  styleUrl: './capcalera.css',
})
export class Capcalera {
  protected readonly geo = inject(GeoExplorerService);
  protected readonly ts = inject(TraduccioService);
  protected readonly sessio = inject(SessioService);

  protected readonly menuUsuariObert = signal(false);
  protected readonly mostrantCercaCoordenades = signal(false);
  protected readonly latText = signal('');
  protected readonly lngText = signal('');
  protected readonly errorCoordenades = signal<string | null>(null);

  protected readonly capes: readonly CapaBase[] = ['topografic', 'satelit', 'estandard'];

  private cercaDebounce?: ReturnType<typeof setTimeout>;

  onCanviRegio(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const regio = this.geo.regions.find((r: Regio) => r.id === id);
    if (regio) this.geo.canviarRegio(regio);
  }

  onCanviCapa(event: Event): void {
    this.geo.canviarCapaBase((event.target as HTMLSelectElement).value as CapaBase);
  }

  /** Debounced: cada tecla no ha de redibuixar tots els marcadors del mapa
   * a l'instant — només un cop l'usuari deixa de teclejar un moment. */
  onCercaInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    clearTimeout(this.cercaDebounce);
    this.cercaDebounce = setTimeout(() => this.geo.actualitzarCerca(valor), 250);
  }

  alternarCercaCoordenades(): void {
    this.mostrantCercaCoordenades.update(v => !v);
    this.errorCoordenades.set(null);
  }

  onLatInput(event: Event): void {
    this.latText.set((event.target as HTMLInputElement).value);
  }

  onLngInput(event: Event): void {
    this.lngText.set((event.target as HTMLInputElement).value);
  }

  cercarCoordenades(event: Event): void {
    event.preventDefault();
    const lat = Number(this.latText().trim().replace(',', '.'));
    const lng = Number(this.lngText().trim().replace(',', '.'));
    const valides = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
    if (!valides) {
      this.errorCoordenades.set(this.ts.t('cerca_coordenades_error'));
      return;
    }
    this.errorCoordenades.set(null);
    this.geo.cercarCoordenades([lat, lng]);
    this.mostrantCercaCoordenades.set(false);
  }
}
