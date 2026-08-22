import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { trobarExerciciPerNom } from '../../data/exercicis-gym.data';
import type { ExerciciGym } from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { ritmeMinutsPerKm } from '../../services/entrenament.util';
import { TraduccioService } from '../../services/traduccio.service';

/**
 * "Pantalla" de detall d'un entrenament assignat — visual i de només
 * lectura (per editar-lo cal l'`editar` de sortida, que obre
 * `editor-entrenament`). S'obre en clicar un entrenament dins de
 * `detall-dia`. Rep només `assignacioId` (no l'objecte sencer) i el busca
 * reactivament a `AssignacionsService.assignacions()` perquè el checkbox
 * de fet/no-fet es mantingui sempre sincronitzat encara que es marqui des
 * d'un altre lloc mentre aquesta pantalla és oberta.
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

  readonly plaId = input.required<string>();
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
    this.assignacionsService.actualitzar(this.plaId(), a.id, { completat: !a.completat });
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
