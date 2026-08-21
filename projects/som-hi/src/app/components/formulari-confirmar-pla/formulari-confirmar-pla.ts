import { Component, inject, input, output, signal } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { avuiISO } from '../../services/data.util';
import { PlansService } from '../../services/plans.service';
import { TraduccioService } from '../../services/traduccio.service';
import type { SeleccioNouPla } from '../crear-pla/crear-pla';

@Component({
  selector: 'app-formulari-confirmar-pla',
  standalone: true,
  templateUrl: './formulari-confirmar-pla.html',
  styleUrl: './formulari-confirmar-pla.css',
})
export class FormulariConfirmarPla {
  private readonly plans = inject(PlansService);
  private readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);

  readonly seleccio = input.required<SeleccioNouPla>();
  readonly tornar = output<void>();

  protected readonly dataInici = signal(avuiISO());
  protected readonly carregant = signal(false);
  protected readonly error = signal<string | null>(null);

  onDataInput(event: Event): void {
    this.dataInici.set((event.target as HTMLInputElement).value);
  }

  crear(event: Event): void {
    event.preventDefault();
    const s = this.seleccio();
    this.carregant.set(true);
    this.error.set(null);
    this.plans.crear(
      {
        dataInici: this.dataInici(),
        ...(s.plaPredefinitId
          ? { plaPredefinitId: s.plaPredefinitId }
          : { nom: s.nom, durationSetmanes: s.durationSetmanes }),
      },
      (pla) => {
        this.carregant.set(false);
        this.nav.obrirPla(pla.id);
      },
      (missatge) => {
        this.carregant.set(false);
        this.error.set(missatge);
      },
    );
  }
}
