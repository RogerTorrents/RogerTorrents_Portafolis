import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ActualitzarPlaPayload, CrearPlaPayload, PlaAmbProgres } from '../models/pla.model';
import { normalitzarDataISO } from './data.util';
import { SessioService } from './sessio.service';

/** Plans de l'usuari autenticat, contra `som-hi-api` (`environment.apiUrl`). */
@Injectable({ providedIn: 'root' })
export class PlansService {
  private readonly http = inject(HttpClient);
  private readonly sessio = inject(SessioService);
  private readonly apiUrl = environment.apiUrl;

  readonly plans = signal<PlaAmbProgres[]>([]);
  readonly carregant = signal(false);
  readonly errorPlans = signal<string | null>(null);

  /** Pla actualment obert (amb progrés). `null` mentre es carrega o no n'hi ha cap d'obert. */
  readonly planObert = signal<PlaAmbProgres | null>(null);
  readonly carregantPlaObert = signal(false);

  constructor() {
    effect(() => {
      const usuari = this.sessio.usuari();
      this.carregarLlista(usuari !== null);
    });
  }

  carregarPla(id: string): void {
    this.carregantPlaObert.set(true);
    this.http
      .get<PlaAmbProgres>(`${this.apiUrl}/plans/${id}`)
      .pipe(map((pla) => this.normalitzar(pla)))
      .subscribe({
        next: (pla) => {
          this.planObert.set(pla);
          this.carregantPlaObert.set(false);
        },
        error: () => this.carregantPlaObert.set(false),
      });
  }

  crear(payload: CrearPlaPayload, alExit: (pla: PlaAmbProgres) => void, alError?: (missatge: string) => void): void {
    this.http
      .post<PlaAmbProgres>(`${this.apiUrl}/plans`, payload)
      .pipe(map((pla) => this.normalitzar(pla)))
      .subscribe({
        next: (pla) => {
          this.plans.update((p) => [pla, ...p]);
          alExit(pla);
        },
        error: (error: HttpErrorResponse) => alError?.(this.missatgeError(error)),
      });
  }

  actualitzar(id: string, payload: ActualitzarPlaPayload, alExit?: () => void): void {
    this.http
      .patch<PlaAmbProgres>(`${this.apiUrl}/plans/${id}`, payload)
      .pipe(map((pla) => this.normalitzar(pla)))
      .subscribe({
        next: (pla) => {
          this.plans.update((p) => p.map((x) => (x.id === id ? { ...x, ...pla } : x)));
          if (this.planObert()?.id === id) this.planObert.set(pla);
          alExit?.();
        },
      });
  }

  eliminar(id: string, alExit?: () => void): void {
    this.http.delete<void>(`${this.apiUrl}/plans/${id}`).subscribe({
      next: () => {
        this.plans.update((p) => p.filter((x) => x.id !== id));
        if (this.planObert()?.id === id) this.planObert.set(null);
        alExit?.();
      },
    });
  }

  private carregarLlista(autenticat: boolean): void {
    if (!autenticat) {
      this.plans.set([]);
      return;
    }
    this.carregant.set(true);
    this.errorPlans.set(null);
    this.http
      .get<PlaAmbProgres[]>(`${this.apiUrl}/plans`)
      .pipe(map((plans) => plans.map((pla) => this.normalitzar(pla))))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.carregant.set(false);
        },
        error: () => {
          this.errorPlans.set('No s’han pogut carregar els plans.');
          this.carregant.set(false);
        },
      });
  }

  private normalitzar(pla: PlaAmbProgres): PlaAmbProgres {
    return { ...pla, dataInici: normalitzarDataISO(pla.dataInici) };
  }

  private missatgeError(error: HttpErrorResponse): string {
    const cos: unknown = error.error?.message;
    return Array.isArray(cos) ? cos.join(' ') : typeof cos === 'string' ? cos : 'Alguna cosa ha fallat.';
  }
}
