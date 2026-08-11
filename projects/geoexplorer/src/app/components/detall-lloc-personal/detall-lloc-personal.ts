import { Component, computed, inject } from '@angular/core';
import { ContingutPersonalService } from '../../services/contingut-personal.service';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { TraduccioService } from '../../services/traduccio.service';
import type { CategoriaPersonal } from '../../models/categoria-personal.model';

@Component({
  selector: 'app-detall-lloc-personal',
  standalone: true,
  templateUrl: './detall-lloc-personal.html',
  styleUrl: './detall-lloc-personal.css',
})
export class DetallLlocPersonal {
  protected readonly contingut = inject(ContingutPersonalService);
  protected readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly categoriaDelLloc = computed<CategoriaPersonal | null>(() => {
    const lloc = this.contingut.llocSeleccionat();
    if (!lloc) return null;
    return this.contingut.categories().find(c => c.id === lloc.categoriaId) ?? null;
  });

  protected readonly urlGoogleMaps = computed(() => {
    const lloc = this.contingut.llocSeleccionat();
    if (!lloc) return '';
    const [lat, lng] = lloc.coordenades;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  });

  tancar(): void {
    this.contingut.seleccionarLloc(null);
  }

  async eliminar(): Promise<void> {
    const lloc = this.contingut.llocSeleccionat();
    if (!lloc) return;
    const confirmat = await this.confirmacio.demanar(this.ts.t('confirmacio_eliminar_lloc', [lloc.nom]));
    if (confirmat) this.contingut.eliminarLloc(lloc.id);
  }
}
