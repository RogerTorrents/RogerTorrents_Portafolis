import { Injectable } from '@angular/core';

const CLAU_STORAGE = 'truc-sessio-activa';

export interface SessioDesada {
  readonly codiSala: string;
  readonly jugadorToken: string;
}

/**
 * Desa el `jugadorToken` perquè un refresc de pàgina o una caiguda de
 * connexió no expulsin el jugador de la sala.
 *
 * `sessionStorage` i no `localStorage`: és per pestanya. Amb dues persones
 * jugant des de dues pestanyes del mateix navegador, una clau compartida
 * faria que totes dues acabessin suplantant el mateix jugador.
 */
@Injectable({ providedIn: 'root' })
export class SessioJugadorService {
  desar(codiSala: string, jugadorToken: string): void {
    const dades: SessioDesada = { codiSala, jugadorToken };
    sessionStorage.setItem(CLAU_STORAGE, JSON.stringify(dades));
  }

  recuperar(): SessioDesada | null {
    const cru = sessionStorage.getItem(CLAU_STORAGE);
    if (!cru) return null;
    try {
      const dades = JSON.parse(cru) as Partial<SessioDesada>;
      if (typeof dades.codiSala === 'string' && typeof dades.jugadorToken === 'string') {
        return { codiSala: dades.codiSala, jugadorToken: dades.jugadorToken };
      }
    } catch {
      // JSON corrupte: es tracta com si no hi hagués sessió desada.
    }
    return null;
  }

  eliminar(): void {
    sessionStorage.removeItem(CLAU_STORAGE);
  }

  /** Oblida la sala i recarrega: socket nou i cap estat residual de la partida. */
  abandonar(): void {
    this.eliminar();
    window.location.reload();
  }
}
