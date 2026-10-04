import { Personatge } from './personatge.model';

export type EstatSala = 'esperant' | 'jugant' | 'acabada';

/**
 * `normal`: 4 jugadors humans. `solo`: 1 humà + 3 bots. `parelles`: 2 humans
 * de la mateixa parella (s'uneixen amb codi, com al mode `normal`) contra
 * 2 bots de la parella rival. Mirall exacte de `ModeSala` al backend.
 */
export type ModeSala = 'normal' | 'solo' | 'parelles';

export interface JugadorPublic {
  readonly seient: number;
  readonly nom: string;
  readonly personatge: Personatge;
  readonly connectat: boolean;
  readonly esBot: boolean;
}

export interface EstatSalaPublic {
  readonly codi: string;
  readonly hostSeient: number;
  readonly estat: EstatSala;
  readonly mode: ModeSala;
  readonly jugadors: readonly (JugadorPublic | null)[];
}

export type RespostaSala =
  | { ok: true; codiSala: string; jugadorToken: string; seient: number }
  | { ok: false; codi: string; missatge: string };

export type RespostaConsultaSala = { ok: true; sala: EstatSalaPublic } | { ok: false; codi: string; missatge: string };

/** Resposta (ack) d'abandonar_partida. Mirall exacte de `RespostaAbandonar` al backend. */
export type RespostaAbandonar = { ok: true } | { ok: false; codi: string; missatge: string };
