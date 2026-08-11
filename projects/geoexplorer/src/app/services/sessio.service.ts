import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Usuari } from '../models/usuari.model';

export type PantallaSessio = 'entrada' | 'login' | 'registre' | 'app';

interface SessioResponse {
  readonly usuari: Usuari;
  readonly accessToken: string;
  readonly refreshToken: string;
}

interface SessioGuardada {
  readonly usuari: Usuari;
  readonly accessToken: string;
  readonly refreshToken: string;
}

const CLAU_STORAGE_SESSIO = 'geoexplorer_sessio';

/**
 * Gestió de sessió i navegació entre pantalles d'accés (entrada / login /
 * registre / app), contra l'API real de `geoexplorer-api`
 * (`POST /auth/registre`, `/auth/login`, `/auth/refresh`, `/auth/logout`).
 *
 * Els tokens (access + refresh) es guarden en memòria i a localStorage
 * (per sobreviure a un refresc de pàgina); l'`authInterceptor` els llegeix
 * via `obtenirAccessToken()` per afegir la capçalera `Authorization` a les
 * crides privades, i crida `refrescarToken()` quan un access token caduca.
 */
@Injectable({ providedIn: 'root' })
export class SessioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly pantalla = signal<PantallaSessio>('entrada');
  readonly usuari = signal<Usuari | null>(null);
  readonly errorSessio = signal<string | null>(null);
  readonly carregant = signal(false);

  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  readonly esConvidat = computed(() => this.pantalla() === 'app' && this.usuari() === null);
  readonly esAutenticat = computed(() => this.usuari() !== null);

  constructor() {
    const guardada = this.carregarSessioGuardada();
    if (guardada) {
      this.usuari.set(guardada.usuari);
      this.accessToken = guardada.accessToken;
      this.refreshToken = guardada.refreshToken;
      this.pantalla.set('app');
    }
  }

  anarA(pantalla: PantallaSessio): void {
    this.errorSessio.set(null);
    this.pantalla.set(pantalla);
  }

  entrarComConvidat(): void {
    this.usuari.set(null);
    this.pantalla.set('app');
  }

  registrar(nom: string, email: string, contrasenya: string): void {
    if (!nom.trim() || !email.trim() || contrasenya.length < 8) {
      this.errorSessio.set('Omple tots els camps (contrasenya mínim 8 caràcters).');
      return;
    }
    this.carregant.set(true);
    this.errorSessio.set(null);
    this.http.post<SessioResponse>(`${this.apiUrl}/auth/registre`, { nom: nom.trim(), email: email.trim(), contrasenya }).subscribe({
      next: resposta => this.gestionarSessioIniciada(resposta),
      error: (error: HttpErrorResponse) => this.gestionarErrorAuth(error, 'No s\'ha pogut crear el compte.'),
    });
  }

  iniciarSessio(email: string, contrasenya: string): void {
    if (!email.trim() || !contrasenya) {
      this.errorSessio.set('Introdueix l\'email i la contrasenya.');
      return;
    }
    this.carregant.set(true);
    this.errorSessio.set(null);
    this.http.post<SessioResponse>(`${this.apiUrl}/auth/login`, { email: email.trim(), contrasenya }).subscribe({
      next: resposta => this.gestionarSessioIniciada(resposta),
      error: (error: HttpErrorResponse) => this.gestionarErrorAuth(error, 'No s\'ha pogut iniciar sessió.'),
    });
  }

  tancarSessio(): void {
    const refreshToken = this.refreshToken;
    this.usuari.set(null);
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(CLAU_STORAGE_SESSIO);
    this.pantalla.set('entrada');
    if (refreshToken) {
      // Best-effort: si falla (xarxa, token ja caducat) no bloqueja el logout local.
      this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({ error: () => undefined });
    }
  }

  /** Usat només per `authInterceptor` per afegir la capçalera `Authorization`. */
  obtenirAccessToken(): string | null {
    return this.accessToken;
  }

  /** Usat només per `authInterceptor` en rebre un 401: intenta obtenir un access token nou. */
  refrescarToken(): Observable<string | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return of(null);

    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(resposta => {
        this.accessToken = resposta.accessToken;
        this.desarSessio();
      }),
      map(resposta => resposta.accessToken),
      catchError(() => {
        this.tancarSessio();
        return of(null);
      }),
    );
  }

  private gestionarSessioIniciada(resposta: SessioResponse): void {
    this.usuari.set(resposta.usuari);
    this.accessToken = resposta.accessToken;
    this.refreshToken = resposta.refreshToken;
    this.desarSessio();
    this.carregant.set(false);
    this.pantalla.set('app');
  }

  private gestionarErrorAuth(error: HttpErrorResponse, missatgePerDefecte: string): void {
    this.carregant.set(false);
    const cos: unknown = error.error?.message;
    const missatge = Array.isArray(cos) ? cos.join(' ') : typeof cos === 'string' ? cos : missatgePerDefecte;
    this.errorSessio.set(missatge);
  }

  private desarSessio(): void {
    const usuari = this.usuari();
    if (!usuari || !this.accessToken || !this.refreshToken) return;
    const dades: SessioGuardada = { usuari, accessToken: this.accessToken, refreshToken: this.refreshToken };
    localStorage.setItem(CLAU_STORAGE_SESSIO, JSON.stringify(dades));
  }

  private carregarSessioGuardada(): SessioGuardada | null {
    try {
      const raw = localStorage.getItem(CLAU_STORAGE_SESSIO);
      return raw ? (JSON.parse(raw) as SessioGuardada) : null;
    } catch {
      return null;
    }
  }
}
