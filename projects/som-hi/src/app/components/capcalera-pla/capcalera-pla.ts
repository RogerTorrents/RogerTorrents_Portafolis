import { Component, computed, inject, input, output } from '@angular/core';
import type { PlaAmbProgres } from '../../models/pla.model';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { avuiISO, dataFiPla, diesEntre } from '../../services/data.util';
import { TraduccioService } from '../../services/traduccio.service';
import { BarraProgres } from '../barra-progres/barra-progres';

@Component({
  selector: 'app-capcalera-pla',
  standalone: true,
  imports: [BarraProgres],
  templateUrl: './capcalera-pla.html',
  styleUrl: './capcalera-pla.css',
})
export class CapceleraPla {
  private readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);

  readonly pla = input.required<PlaAmbProgres>();
  readonly tornar = output<void>();
  readonly eliminar = output<void>();

  protected readonly dataFi = computed(() => dataFiPla(this.pla().dataInici, this.pla().durationSetmanes));
  protected readonly totalDies = computed(() => this.pla().durationSetmanes * 7);
  protected readonly diaActual = computed(() =>
    Math.min(this.totalDies(), Math.max(1, diesEntre(this.pla().dataInici, avuiISO()) + 1)),
  );
  protected readonly diesRestants = computed(() => diesEntre(avuiISO(), this.dataFi()));
  protected readonly diesFinsInici = computed(() => diesEntre(avuiISO(), this.pla().dataInici));

  protected readonly estat = computed<'proper' | 'actiu' | 'finalitzat'>(() => {
    const avui = avuiISO();
    if (avui < this.pla().dataInici) return 'proper';
    if (avui > this.dataFi()) return 'finalitzat';
    return 'actiu';
  });

  async confirmarEliminar(): Promise<void> {
    const confirmat = await this.confirmacio.demanar(this.ts.t('pla_eliminar_confirmacio', [this.pla().nom]));
    if (confirmat) this.eliminar.emit();
  }
}
