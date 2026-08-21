import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import type {
  ActualitzarEntrenamentPayload,
  CrearEntrenamentPayload,
  Entrenament,
} from '../models/entrenament.model';

/** Definicions reutilitzables d'entrenament del pla actualment obert. */
@Injectable({ providedIn: 'root' })
export class EntrenamentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly entrenaments = signal<Entrenament[]>([]);
  readonly carregant = signal(false);

  carregarDePla(plaId: string): void {
    this.carregant.set(true);
    this.http.get<Entrenament[]>(`${this.apiUrl}/plans/${plaId}/entrenaments`).subscribe({
      next: (entrenaments) => {
        this.entrenaments.set(entrenaments);
        this.carregant.set(false);
      },
      error: () => this.carregant.set(false),
    });
  }

  crear(
    plaId: string,
    payload: CrearEntrenamentPayload,
    alExit: (entrenament: Entrenament) => void,
    alError?: (missatge: string) => void,
  ): void {
    this.http.post<Entrenament>(`${this.apiUrl}/plans/${plaId}/entrenaments`, payload).subscribe({
      next: (entrenament) => {
        // Els més recents primer, mateix ordre que `GET .../entrenaments`.
        this.entrenaments.update((e) => [entrenament, ...e]);
        alExit(entrenament);
      },
      error: (error: HttpErrorResponse) => alError?.(this.missatgeError(error)),
    });
  }

  actualitzar(
    id: string,
    payload: ActualitzarEntrenamentPayload,
    alExit: (entrenament: Entrenament) => void,
    alError?: (missatge: string) => void,
  ): void {
    this.http.patch<Entrenament>(`${this.apiUrl}/entrenaments/${id}`, payload).subscribe({
      next: (entrenament) => {
        this.entrenaments.update((e) => e.map((x) => (x.id === id ? entrenament : x)));
        alExit(entrenament);
      },
      error: (error: HttpErrorResponse) => alError?.(this.missatgeError(error)),
    });
  }

  eliminar(id: string, alExit?: () => void): void {
    this.http.delete<void>(`${this.apiUrl}/entrenaments/${id}`).subscribe({
      next: () => {
        this.entrenaments.update((e) => e.filter((x) => x.id !== id));
        alExit?.();
      },
    });
  }

  private missatgeError(error: HttpErrorResponse): string {
    const cos: unknown = error.error?.message;
    return Array.isArray(cos) ? cos.join(' ') : typeof cos === 'string' ? cos : 'Alguna cosa ha fallat.';
  }
}
