import { Component, inject, input, output, signal } from '@angular/core';
import type { Entrenament } from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { EntrenamentsService } from '../../services/entrenaments.service';
import { TraduccioService } from '../../services/traduccio.service';
import { DetallEntrenamentDades } from '../detall-entrenament-dades/detall-entrenament-dades';

@Component({
  selector: 'app-selector-entrenament-existent',
  standalone: true,
  imports: [DetallEntrenamentDades],
  templateUrl: './selector-entrenament-existent.html',
  styleUrl: './selector-entrenament-existent.css',
})
export class SelectorEntrenamentExistent {
  protected readonly entrenamentsService = inject(EntrenamentsService);
  private readonly assignacionsService = inject(AssignacionsService);
  protected readonly ts = inject(TraduccioService);

  readonly plaId = input.required<string>();
  readonly data = input.required<string>();

  readonly tancar = output<void>();
  readonly afegit = output<void>();
  readonly crearNou = output<void>();
  readonly assignarMassiu = output<Entrenament>();

  protected readonly afegintId = signal<string | null>(null);

  afegir(entrenament: Entrenament): void {
    if (this.afegintId()) return;
    this.afegintId.set(entrenament.id);
    this.assignacionsService.crear(this.plaId(), { entrenamentId: entrenament.id, data: this.data() }, () => {
      this.afegintId.set(null);
      this.afegit.emit();
    });
  }
}
