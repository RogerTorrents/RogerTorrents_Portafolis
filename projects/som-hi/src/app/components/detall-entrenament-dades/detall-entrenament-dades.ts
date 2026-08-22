import { Component, inject, input, signal } from '@angular/core';
import { trobarExerciciPerNom } from '../../data/exercicis-gym.data';
import type { DadesEntrenament, ExerciciGym } from '../../models/entrenament.model';
import { ritmeMinutsPerKm } from '../../services/entrenament.util';
import { TraduccioService } from '../../services/traduccio.service';

/**
 * Resum llegible de `dades` (una per modalitat), reutilitzat allà on cal
 * veure clarament el contingut d'un entrenament sense obrir l'editor:
 * `detall-dia` i `selector-entrenament-existent`. Per a GYM inclou una
 * miniatura per exercici (versió compacta — la vista grossa i visual és
 * `veure-entrenament`).
 */
@Component({
  selector: 'app-detall-entrenament-dades',
  standalone: true,
  templateUrl: './detall-entrenament-dades.html',
  styleUrl: './detall-entrenament-dades.css',
})
export class DetallEntrenamentDades {
  protected readonly ts = inject(TraduccioService);
  protected readonly ritmeMinutsPerKm = ritmeMinutsPerKm;

  readonly dades = input.required<DadesEntrenament>();

  private readonly imatgesTrencades = signal<ReadonlySet<string>>(new Set());

  protected imatgeDe(exercici: ExerciciGym): string | null {
    return trobarExerciciPerNom(exercici.nom)?.exercici.imatge ?? null;
  }

  protected imatgeTrencada(imatge: string): boolean {
    return this.imatgesTrencades().has(imatge);
  }

  protected onErrorImatge(imatge: string): void {
    this.imatgesTrencades.update((s) => new Set(s).add(imatge));
  }
}
