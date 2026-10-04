import { Injectable } from '@angular/core';

const CLAU_STORAGE = 'truc-sessio-activa';

export interface SessioDesada {
  readonly codiSala: string;
  readonly jugadorToken: string;
}

/**
 * Desa el `jugadorToken` a `sessionStorage` (NO `localStorage`) perquè un
 * refresc de pàgina (o una caiguda de connexió puntual) no expulsi el
 * jugador de la sala — en tornar a obrir l'app es pot intentar
 * `reconnectar` amb aquestes dades abans de mostrar el menú inicial.
 *
 * **Per què `sessionStorage` i no `localStorage`** (bug real trobat i
 * corregit): `localStorage` es comparteix entre TOTES les pestanyes del
 * mateix navegador/origen. Als modes amb més d'un jugador humà (`normal`,
 * `parelles`), és habitual que 2 persones juguin des de 2 pestanyes del
 * mateix dispositiu (o que un mateix desenvolupador ho provi així) — amb
 * `localStorage`, la segona pestanya que es guarda (p.ex. la parella
 * unint-se) sobreescriu la clau compartida, i si la PRIMERA pestanya mai
 * es refresca, `intentarReconnectar()` hi recupera el token de l'ALTRA
 * persona: totes dues pestanyes acaben suplantant el mateix jugador, i
 * quan és realment el torn de l'altre, cap de les dues interfícies ho
 * detecta (`elMeuSeient` mai coincideix amb `torn`) — exactament el
 * símptoma "quan li toca tirar a la segona persona, sembla que li toca a
 * l'altra i cap dels dos pot tirar". `sessionStorage` és per pestanya, no
 * per origen, així que aquest problema desapareix per construcció.
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

  /**
   * Abandona la sessió activa (partida en curs o acabada) i recarrega la
   * pàgina: la manera més senzilla de garantir un socket nou i cap estat
   * residual de l'antiga sala en tornar al menú — mateix patró que ja feia
   * servir `partida-acabada` en tornar al menú després de guanyar/perdre.
   */
  abandonar(): void {
    this.eliminar();
    window.location.reload();
  }
}
