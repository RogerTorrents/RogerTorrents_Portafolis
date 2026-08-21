import { Component, computed, inject, input } from '@angular/core';
import type { PlaAmbProgres } from '../../models/pla.model';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { avuiISO, dataFiPla, diesEntre } from '../../services/data.util';
import { NavegacioService } from '../../services/navegacio.service';
import { PlansService } from '../../services/plans.service';
import { TraduccioService } from '../../services/traduccio.service';
import { BarraProgres } from '../barra-progres/barra-progres';

type EstatPla = 'proper' | 'actiu' | 'finalitzat';

@Component({
  selector: 'app-pla-card',
  standalone: true,
  imports: [BarraProgres],
  templateUrl: './pla-card.html',
  styleUrl: './pla-card.css',
})
export class PlaCard {
  private readonly plans = inject(PlansService);
  private readonly nav = inject(NavegacioService);
  private readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);

  readonly pla = input.required<PlaAmbProgres>();

  protected readonly estat = computed<EstatPla>(() => {
    const pla = this.pla();
    const avui = avuiISO();
    if (avui < pla.dataInici) return 'proper';
    if (avui > dataFiPla(pla.dataInici, pla.durationSetmanes)) return 'finalitzat';
    return 'actiu';
  });

  protected readonly diesRestants = computed(() => {
    const pla = this.pla();
    return Math.max(0, diesEntre(avuiISO(), dataFiPla(pla.dataInici, pla.durationSetmanes)));
  });

  protected readonly diesFinsInici = computed(() => diesEntre(avuiISO(), this.pla().dataInici));

  obrir(): void {
    this.nav.obrirPla(this.pla().id);
  }

  async eliminar(event: Event): Promise<void> {
    event.stopPropagation();
    const pla = this.pla();
    const confirmat = await this.confirmacio.demanar(this.ts.t('pla_eliminar_confirmacio', [pla.nom]));
    if (confirmat) this.plans.eliminar(pla.id);
  }
}
