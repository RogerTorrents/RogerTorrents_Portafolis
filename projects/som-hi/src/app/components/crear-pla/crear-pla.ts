import { Component, inject, signal } from '@angular/core';
import type { PlaPredefinit } from '../../models/pla-predefinit.model';
import { NavegacioService } from '../../services/navegacio.service';
import { TraduccioService } from '../../services/traduccio.service';
import { FormulariConfirmarPla } from '../formulari-confirmar-pla/formulari-confirmar-pla';
import { FormulariPlaDesDeZero } from '../formulari-pla-des-de-zero/formulari-pla-des-de-zero';
import { GaleriaPlansPredefinits } from '../galeria-plans-predefinits/galeria-plans-predefinits';

type PasCreacio = 'opcions' | 'galeria' | 'des-de-zero' | 'confirmar';

export interface SeleccioNouPla {
  readonly nom: string;
  readonly durationSetmanes: number;
  readonly plaPredefinitId?: string;
}

@Component({
  selector: 'app-crear-pla',
  standalone: true,
  imports: [GaleriaPlansPredefinits, FormulariPlaDesDeZero, FormulariConfirmarPla],
  templateUrl: './crear-pla.html',
  styleUrl: './crear-pla.css',
})
export class CrearPla {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly pas = signal<PasCreacio>('opcions');
  protected readonly seleccio = signal<SeleccioNouPla | null>(null);

  triarPredefinit(pla: PlaPredefinit): void {
    this.seleccio.set({ nom: pla.nom, durationSetmanes: pla.durationSetmanes, plaPredefinitId: pla.id });
    this.pas.set('confirmar');
  }

  continuarDesDeZero(dades: { nom: string; durationSetmanes: number }): void {
    this.seleccio.set(dades);
    this.pas.set('confirmar');
  }

  tornarAOpcions(): void {
    this.seleccio.set(null);
    this.pas.set('opcions');
  }
}
