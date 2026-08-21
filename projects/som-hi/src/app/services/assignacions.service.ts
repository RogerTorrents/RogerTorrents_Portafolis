import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ActualitzarAssignacioPayload,
  AssignacioAmbEntrenament,
  CrearAssignacioMassivaPayload,
  CrearAssignacioPayload,
} from '../models/assignacio.model';
import { normalitzarDataISO } from './data.util';

/** Assignacions (col·locacions en dates) del pla actualment obert. */
@Injectable({ providedIn: 'root' })
export class AssignacionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly assignacions = signal<AssignacioAmbEntrenament[]>([]);
  readonly carregant = signal(false);

  carregarDePla(plaId: string): void {
    this.carregant.set(true);
    this.http
      .get<AssignacioAmbEntrenament[]>(`${this.apiUrl}/plans/${plaId}/assignacions`)
      .pipe(map((assignacions) => assignacions.map((a) => this.normalitzar(a))))
      .subscribe({
        next: (assignacions) => {
          this.assignacions.set(assignacions);
          this.carregant.set(false);
        },
        error: () => this.carregant.set(false),
      });
  }

  crear(
    plaId: string,
    payload: CrearAssignacioPayload,
    alExit: () => void,
    alError?: (missatge: string) => void,
  ): void {
    this.http.post<AssignacioAmbEntrenament>(`${this.apiUrl}/plans/${plaId}/assignacions`, payload).subscribe({
      next: () => {
        this.carregarDePla(plaId);
        alExit();
      },
      error: (error: HttpErrorResponse) => alError?.(this.missatgeError(error)),
    });
  }

  crearMassiu(
    plaId: string,
    payload: CrearAssignacioMassivaPayload,
    alExit: (creades: number) => void,
    alError?: (missatge: string) => void,
  ): void {
    this.http
      .post<{ creades: number }>(`${this.apiUrl}/plans/${plaId}/assignacions/massiu`, payload)
      .subscribe({
        next: (resultat) => {
          this.carregarDePla(plaId);
          alExit(resultat.creades);
        },
        error: (error: HttpErrorResponse) => alError?.(this.missatgeError(error)),
      });
  }

  actualitzar(plaId: string, id: string, payload: ActualitzarAssignacioPayload, alExit?: () => void): void {
    this.http
      .patch<AssignacioAmbEntrenament>(`${this.apiUrl}/assignacions/${id}`, payload)
      .pipe(map((assignacio) => this.normalitzar(assignacio)))
      .subscribe({
        next: (assignacio) => {
          this.assignacions.update((a) => a.map((x) => (x.id === id ? { ...x, ...assignacio } : x)));
          alExit?.();
        },
      });
  }

  eliminar(id: string, alExit?: () => void): void {
    this.http.delete<void>(`${this.apiUrl}/assignacions/${id}`).subscribe({
      next: () => {
        this.assignacions.update((a) => a.filter((x) => x.id !== id));
        alExit?.();
      },
    });
  }

  private normalitzar(assignacio: AssignacioAmbEntrenament): AssignacioAmbEntrenament {
    return { ...assignacio, data: normalitzarDataISO(assignacio.data) };
  }

  private missatgeError(error: HttpErrorResponse): string {
    const cos: unknown = error.error?.message;
    return Array.isArray(cos) ? cos.join(' ') : typeof cos === 'string' ? cos : 'Alguna cosa ha fallat.';
  }
}
