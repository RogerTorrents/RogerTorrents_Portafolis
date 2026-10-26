import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Usuari } from '../models/usuari.model';

export type PantallaSessio = 'entrada' | 'login' | 'registre' | 'app';

interface SessioResponse {
  readonly usuari: Usuari;
  readonly accessToken: string;
}

interface SessioGuardada {
  readonly usuari: Usuari;
  readonly accessToken: string;
  /** Només a sessions desades abans que el refresh token passés a cookie. */
  readonly refreshToken?: string;
}

/** Cada app té la seva cookie de sessió a l'API (veure `urlAuth`). */
const APP_CLIENT = 'som-hi';

/**
 * Les crides `/auth/*` porten la cookie HttpOnly amb el refresh token: el
 * navegador la guarda i l'envia sola, i el JavaScript de la pàgina no la pot
 * llegir (un XSS no la pot robar, a diferència del `localStorage`).
 */
const AMB_COOKIE = { withCredentials: true } as const;

const CLAU_STORAGE_SESSIO = 'som_hi_sessio';

/**
 * Gestió de sessió i navegació entre pantalles d'accés (entrada / login /
 * registre / app) — contra `geoexplorer-api`, NO contra un backend propi:
 * "el mateix compte que GeoExplorer" és literalment la mateixa taula
 * d'usuaris, així que registre/login/refresh/logout criden
 * `environment.authApiUrl`. `som-hi-api` (`environment.apiUrl`) només
 * verifica el token que aquí s'obté, mai n'emet cap de nou.
 *
 * Clau de `localStorage` pròpia (`som_hi_sessio`, diferent de
 * `geoexplorer_sessio`) perquè un usuari pugui tenir sessió activa a totes
 * dues apps alhora sense que es trepitgin.
 */
@Injectable({ providedIn: 'root' })
export class SessioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.authApiUrl;

  readonly pantalla = signal<PantallaSessio>('entrada');
  readonly usuari = signal<Usuari | null>(null);
  readonly errorSessio = signal<string | null>(null);
  readonly carregant = signal(false);

  readonly dialegEliminarCompteObert = signal(false);
  readonly eliminantCompte = signal(false);
  /** `missatge` null → el diàleg mostra el text genèric traduït. */
  readonly errorEliminarCompte = signal<{ readonly missatge: string | null } | null>(null);

  private accessToken: string | null = null;
  /** Sessió desada amb la versió anterior: el primer refresh el passa a cookie. */
  private refreshTokenAntic: string | null = null;

  readonly esAutenticat = computed(() => this.usuari() !== null);

  constructor() {
    const guardada = this.carregarSessioGuardada();
    if (guardada) {
      this.usuari.set(guardada.usuari);
      this.accessToken = guardada.accessToken;
      this.refreshTokenAntic = guardada.refreshToken ?? null;
      this.pantalla.set('app');
    }
  }

  anarA(pantalla: PantallaSessio): void {
    this.errorSessio.set(null);
    this.pantalla.set(pantalla);
  }

  registrar(nom: string, email: string, contrasenya: string): void {
    if (!nom.trim() || !email.trim() || contrasenya.length < 8) {
      this.errorSessio.set('Omple tots els camps (contrasenya mínim 8 caràcters).');
      return;
    }
    this.carregant.set(true);
    this.errorSessio.set(null);
    this.http
      .post<SessioResponse>(this.urlAuth('registre'), {
        nom: nom.trim(),
        email: email.trim(),
        contrasenya,
      }, AMB_COOKIE)
      .subscribe({
        next: (resposta) => this.gestionarSessioIniciada(resposta),
        error: (error: HttpErrorResponse) =>
          this.gestionarErrorAuth(error, "No s'ha pogut crear el compte."),
      });
  }

  iniciarSessio(email: string, contrasenya: string): void {
    if (!email.trim() || !contrasenya) {
      this.errorSessio.set("Introdueix l'email i la contrasenya.");
      return;
    }
    this.carregant.set(true);
    this.errorSessio.set(null);
    this.http
      .post<SessioResponse>(this.urlAuth('login'), { email: email.trim(), contrasenya }, AMB_COOKIE)
      .subscribe({
        next: (resposta) => this.gestionarSessioIniciada(resposta),
        error: (error: HttpErrorResponse) =>
          this.gestionarErrorAuth(error, "No s'ha pogut iniciar sessió."),
      });
  }

  tancarSessio(): void {
    const estavaAutenticat = this.usuari() !== null;
    const cos = this.cosAmbTokenAntic();
    this.netejarSessioLocal();
    if (estavaAutenticat) {
      // Best-effort: si falla (xarxa, token ja caducat) no bloqueja el logout local.
      this.http.post(this.urlAuth('logout'), cos, AMB_COOKIE).subscribe({ error: () => undefined });
    }
  }

  obrirDialegEliminarCompte(): void {
    this.errorEliminarCompte.set(null);
    this.dialegEliminarCompteObert.set(true);
  }

  tancarDialegEliminarCompte(): void {
    if (this.eliminantCompte()) return;
    this.dialegEliminarCompteObert.set(false);
  }

  /**
   * Dret de supressió (RGPD): elimina el compte i TOTES les seves dades.
   * 1) refresca l'access token (pot haver caducat i `/auth/*` no es
   *    reintenta sol); 2) `DELETE /auth/compte` a geoexplorer-api verifica
   *    la contrasenya i esborra compte + mapa personal; 3) amb el mateix
   *    token (encara vàlid uns minuts) esborra les dades de Som-hi.
   */
  eliminarCompte(contrasenya: string): void {
    if (!contrasenya || this.eliminantCompte()) return;
    this.eliminantCompte.set(true);
    this.errorEliminarCompte.set(null);

    this.refrescarToken()
      .pipe(
        switchMap((token) => {
          // Sessió caducada: `refrescarToken` ja ha tancat la sessió.
          if (!token) return throwError(() => null);
          return this.http.delete<void>(this.urlAuth('compte'), { body: { contrasenya }, ...AMB_COOKIE });
        }),
        switchMap(() =>
          this.http.delete<void>(`${environment.apiUrl}/compte`).pipe(
            catchError((error: unknown) => {
              // El compte ja no existeix: no es pot bloquejar l'usuari aquí.
              console.error("No s'han pogut esborrar les dades de Som-hi", error);
              return of(undefined);
            }),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.eliminantCompte.set(false);
          this.dialegEliminarCompteObert.set(false);
          this.netejarSessioLocal();
        },
        error: (error: unknown) => {
          this.eliminantCompte.set(false);
          if (error === null) {
            this.dialegEliminarCompteObert.set(false);
            return;
          }
          const cos: unknown = error instanceof HttpErrorResponse ? error.error?.message : null;
          this.errorEliminarCompte.set({ missatge: typeof cos === 'string' ? cos : null });
        },
      });
  }

  /** Usat només per `authInterceptor` per afegir la capçalera `Authorization`. */
  obtenirAccessToken(): string | null {
    return this.accessToken;
  }

  /** Usat només per `authInterceptor` en rebre un 401: intenta obtenir un access token nou. */
  refrescarToken(): Observable<string | null> {
    if (this.usuari() === null) return of(null);

    return this.http.post<{ accessToken: string }>(this.urlAuth('refresh'), this.cosAmbTokenAntic(), AMB_COOKIE).pipe(
      tap((resposta) => {
        this.accessToken = resposta.accessToken;
        // Ja migrat: a partir d'ara només hi ha la cookie.
        this.refreshTokenAntic = null;
        this.desarSessio();
      }),
      map((resposta) => resposta.accessToken),
      catchError(() => {
        this.tancarSessio();
        return of(null);
      }),
    );
  }

  private urlAuth(ruta: string): string {
    return `${this.apiUrl}/auth/${ruta}?app=${APP_CLIENT}`;
  }

  /** Cos de refresh/logout: buit (va la cookie) o el token d'una sessió antiga. */
  private cosAmbTokenAntic(): { refreshToken?: string } {
    return this.refreshTokenAntic ? { refreshToken: this.refreshTokenAntic } : {};
  }

  private netejarSessioLocal(): void {
    this.usuari.set(null);
    this.accessToken = null;
    this.refreshTokenAntic = null;
    localStorage.removeItem(CLAU_STORAGE_SESSIO);
    this.pantalla.set('entrada');
  }

  private gestionarSessioIniciada(resposta: SessioResponse): void {
    this.usuari.set(resposta.usuari);
    this.accessToken = resposta.accessToken;
    this.refreshTokenAntic = null;
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
    if (!usuari || !this.accessToken) return;
    const dades: SessioGuardada = {
      usuari,
      accessToken: this.accessToken,
      // Fins que el primer refresh el passi a cookie, no es pot perdre.
      ...(this.refreshTokenAntic ? { refreshToken: this.refreshTokenAntic } : {}),
    };
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
