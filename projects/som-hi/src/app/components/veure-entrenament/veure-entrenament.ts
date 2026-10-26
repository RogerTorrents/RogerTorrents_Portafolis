import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { trobarExerciciPerNom } from '../../data/exercicis-gym.data';
import type { ExerciciGym } from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { ritmeMinutsPerKm } from '../../services/entrenament.util';
import { TraduccioService } from '../../services/traduccio.service';

/**
 * Detall d'un entrenament assignat, de només lectura. Rep l'`assignacioId` i
 * el busca a `AssignacionsService` perquè l'estat de fet/no fet es mantingui
 * sincronitzat encara que es marqui des d'un altre lloc.
 */
@Component({
  selector: 'app-veure-entrenament',
  standalone: true,
  templateUrl: './veure-entrenament.html',
  styleUrl: './veure-entrenament.css',
})
export class VeureEntrenament {
  private readonly assignacionsService = inject(AssignacionsService);
  protected readonly ts = inject(TraduccioService);
  protected readonly ritmeMinutsPerKm = ritmeMinutsPerKm;

  readonly assignacioId = input.required<string>();

  readonly tancar = output<void>();
  readonly editar = output<string>();

  private readonly imatgesTrencades = signal<ReadonlySet<string>>(new Set());

  /** Foto de gym ampliada en gran (lightbox) — `null` si cap. */
  protected readonly imatgeAmpliada = signal<string | null>(null);

  protected readonly assignacio = computed(() =>
    this.assignacionsService.assignacions().find((a) => a.id === this.assignacioId()),
  );

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.imatgeAmpliada.set(null);
  }

  ampliarImatge(imatge: string): void {
    this.imatgeAmpliada.set(imatge);
  }

  alternarFet(): void {
    const a = this.assignacio();
    if (!a) return;
    this.assignacionsService.actualitzar(a.id, { completat: !a.completat });
  }

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
