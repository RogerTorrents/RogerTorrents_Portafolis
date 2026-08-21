import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import type { PlaPredefinit, PlaPredefinitAmbEntrenaments } from '../models/pla-predefinit.model';

/** Les 10 plantilles oficials — contingut fix, igual per a tothom, cachejat un cop carregat. */
@Injectable({ providedIn: 'root' })
export class PlansPredefinitsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly plans = signal<PlaPredefinit[]>([]);
  readonly carregant = signal(false);
  private carregats = false;

  carregar(): void {
    if (this.carregats || this.carregant()) return;
    this.carregant.set(true);
    this.http.get<PlaPredefinit[]>(`${this.apiUrl}/plans-predefinits`).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.carregats = true;
        this.carregant.set(false);
      },
      error: () => this.carregant.set(false),
    });
  }

  obtenirDetall(id: string, alExit: (pla: PlaPredefinitAmbEntrenaments) => void): void {
    this.http.get<PlaPredefinitAmbEntrenaments>(`${this.apiUrl}/plans-predefinits/${id}`).subscribe({
      next: alExit,
    });
  }
}
