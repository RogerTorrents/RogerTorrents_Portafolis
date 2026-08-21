import { Component, computed, inject, input, output } from '@angular/core';
import type { AssignacioAmbEntrenament } from '../../models/assignacio.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { parsejarDataLocal } from '../../services/data.util';
import { TraduccioService } from '../../services/traduccio.service';
import { DetallEntrenamentDades } from '../detall-entrenament-dades/detall-entrenament-dades';

@Component({
  selector: 'app-detall-dia',
  standalone: true,
  imports: [DetallEntrenamentDades],
  templateUrl: './detall-dia.html',
  styleUrl: './detall-dia.css',
})
export class DetallDia {
  private readonly assignacionsService = inject(AssignacionsService);
  private readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);

  readonly plaId = input.required<string>();
  readonly data = input.required<string>();

  readonly tancar = output<void>();
  readonly afegirEntrenament = output<void>();
  readonly editarEntrenament = output<string>();
  readonly veureEntrenament = output<string>();

  protected readonly assignacionsDelDia = computed<readonly AssignacioAmbEntrenament[]>(() =>
    this.assignacionsService.assignacions().filter((a) => a.data === this.data()),
  );

  protected readonly dataLlegible = computed(() =>
    parsejarDataLocal(this.data()).toLocaleDateString(this.ts.idioma(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  );

  alternarFet(assignacio: AssignacioAmbEntrenament): void {
    this.assignacionsService.actualitzar(this.plaId(), assignacio.id, { completat: !assignacio.completat });
  }

  async eliminar(assignacio: AssignacioAmbEntrenament): Promise<void> {
    const confirmat = await this.confirmacio.demanar(
      this.ts.t('assignacio_eliminar_confirmacio', [assignacio.entrenament.titol]),
    );
    if (confirmat) this.assignacionsService.eliminar(assignacio.id);
  }
}
