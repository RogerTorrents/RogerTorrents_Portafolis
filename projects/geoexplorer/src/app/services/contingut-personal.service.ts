import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { SessioService } from './sessio.service';
import type { CategoriaPersonal } from '../models/categoria-personal.model';
import type { LlocPersonal } from '../models/lloc-personal.model';
import type { Coordenades } from '../models/poi.model';

/**
 * Mapa personal de l'usuari autenticat: categories pròpies (ex. "Llocs on
 * he viatjat") i llocs propis dins d'aquestes categories, contra l'API real
 * (`GET/POST /categories`, `GET/POST /llocs`, `DELETE /categories/:id`,
 * `DELETE /llocs/:id`).
 */
@Injectable({ providedIn: 'root' })
export class ContingutPersonalService {
  private readonly http = inject(HttpClient);
  private readonly sessio = inject(SessioService);
  private readonly apiUrl = environment.apiUrl;

  readonly categories = signal<CategoriaPersonal[]>([]);
  readonly llocs = signal<LlocPersonal[]>([]);
  readonly categoriesVisibles = signal<ReadonlySet<string>>(new Set());
  readonly carregant = signal(false);

  /** Categoria dins la qual s'està col·locant un nou lloc (mode "clica al mapa"). */
  readonly categoriaEnColocacio = signal<string | null>(null);
  /** Coordenades capturades pel darrer clic al mapa mentre `categoriaEnColocacio` és actiu. */
  readonly coordenadesPendents = signal<Coordenades | null>(null);
  /** Lloc que cal centrar al mapa (clic des del llistat de la sidebar). Consumit per `Mapa`. */
  readonly llocEnfocat = signal<LlocPersonal | null>(null);
  /** Lloc mostrat al panell de detall (`DetallLlocPersonal`). */
  readonly llocSeleccionat = signal<LlocPersonal | null>(null);

  readonly enModeColocacio = computed(() => this.categoriaEnColocacio() !== null);

  readonly llocsVisibles = computed(() => {
    const visibles = this.categoriesVisibles();
    return this.llocs().filter(lloc => visibles.has(lloc.categoriaId));
  });

  constructor() {
    effect(() => {
      const usuari = this.sessio.usuari();
      this.carregar(usuari !== null);
    });
  }

  crearCategoria(nom: string, color: string, icona: string): void {
    if (!nom.trim()) return;
    this.http.post<CategoriaPersonal>(`${this.apiUrl}/categories`, { nom: nom.trim(), color, icona }).subscribe({
      next: categoria => {
        this.categories.update(c => [...c, categoria]);
        this.categoriesVisibles.update(v => new Set(v).add(categoria.id));
      },
    });
  }

  eliminarCategoria(categoriaId: string): void {
    this.http.delete<void>(`${this.apiUrl}/categories/${categoriaId}`).subscribe({
      next: () => {
        this.categories.update(c => c.filter(cat => cat.id !== categoriaId));
        this.llocs.update(l => l.filter(lloc => lloc.categoriaId !== categoriaId));
        this.categoriesVisibles.update(v => {
          const nou = new Set(v);
          nou.delete(categoriaId);
          return nou;
        });
        if (this.llocSeleccionat()?.categoriaId === categoriaId) this.llocSeleccionat.set(null);
      },
    });
  }

  alternarVisibilitatCategoria(categoriaId: string): void {
    this.categoriesVisibles.update(v => {
      const nou = new Set(v);
      nou.has(categoriaId) ? nou.delete(categoriaId) : nou.add(categoriaId);
      return nou;
    });
  }

  iniciarColocacio(categoriaId: string): void {
    this.categoriaEnColocacio.set(categoriaId);
    this.coordenadesPendents.set(null);
  }

  cancelarColocacio(): void {
    this.categoriaEnColocacio.set(null);
    this.coordenadesPendents.set(null);
  }

  registrarClicMapa(coordenades: Coordenades): void {
    if (this.enModeColocacio()) this.coordenadesPendents.set(coordenades);
  }

  enfocarLloc(lloc: LlocPersonal): void {
    this.categoriesVisibles.update(v => new Set(v).add(lloc.categoriaId));
    this.llocEnfocat.set(lloc);
    this.llocSeleccionat.set(lloc);
  }

  seleccionarLloc(lloc: LlocPersonal | null): void {
    this.llocSeleccionat.set(lloc);
  }

  crearLloc(nom: string, descripcio: string): void {
    const categoriaId = this.categoriaEnColocacio();
    const coordenades = this.coordenadesPendents();
    if (!categoriaId || !coordenades || !nom.trim()) return;

    const cos = { categoriaId, nom: nom.trim(), coordenades, descripcio: descripcio.trim() };
    this.http.post<LlocPersonal>(`${this.apiUrl}/llocs`, cos).subscribe({
      next: lloc => {
        this.llocs.update(l => [...l, lloc]);
        this.cancelarColocacio();
      },
    });
  }

  eliminarLloc(llocId: string): void {
    this.http.delete<void>(`${this.apiUrl}/llocs/${llocId}`).subscribe({
      next: () => {
        this.llocs.update(l => l.filter(lloc => lloc.id !== llocId));
        if (this.llocSeleccionat()?.id === llocId) this.llocSeleccionat.set(null);
      },
    });
  }

  private carregar(autenticat: boolean): void {
    if (!autenticat) {
      this.categories.set([]);
      this.llocs.set([]);
      this.categoriesVisibles.set(new Set());
      this.llocSeleccionat.set(null);
      return;
    }

    this.carregant.set(true);
    this.http.get<CategoriaPersonal[]>(`${this.apiUrl}/categories`).subscribe({
      next: categories => {
        this.categories.set(categories);
        this.categoriesVisibles.set(new Set(categories.map(c => c.id)));
        this.carregant.set(false);
      },
      error: () => this.carregant.set(false),
    });
    this.http.get<LlocPersonal[]>(`${this.apiUrl}/llocs`).subscribe({
      next: llocs => this.llocs.set(llocs),
    });
  }
}
