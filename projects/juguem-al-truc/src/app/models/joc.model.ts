import { Carta } from './carta.model';
import { Equip } from './personatge.model';

export type ResultatRonda = Equip | 'empat';
export type TipusSenyal = 'un-1' | 'un-2' | 'un-3' | 'res';
export type MotiuFiMa = 'normal' | 'truc_rebutjat' | 'ma11_rebutjada' | 'empat_total';

export interface CartaJugada {
  readonly seient: number;
  readonly carta: Carta;
}

export interface EstatAposta {
  readonly valor: 1 | 2 | 3;
  readonly equipUltimCantador: Equip | null;
  readonly pendent: boolean;
}

/** Vista personalitzada d'aquest jugador: mai conté les cartes dels altres seients. */
export interface VistaJugador {
  readonly elMeuSeient: number;
  readonly puntuacions: Readonly<Record<Equip, number>>;
  readonly guanyadorPartida: Equip | null;
  readonly maPropia: readonly Carta[] | null;
  readonly cartesRestants: readonly [number, number, number, number] | null;
  readonly torn: number | null;
  readonly distribuidor: number | null;
  readonly cartesRondaActual: readonly CartaJugada[];
  readonly historialRondes: readonly ResultatRonda[];
  readonly aposta: EstatAposta | null;
  readonly ma11Pendent: Equip | null;
  /** Certa durant tota la mà dels 11 (abans i després de decidir) — mentre ho sigui, no es pot cantar Truc. */
  readonly esMaDels11: boolean;
}

export type EsdevenimentJoc =
  | { tipus: 'carta_jugada'; seient: number; carta: Carta }
  | { tipus: 'ronda_resolta'; guanyador: ResultatRonda }
  | { tipus: 'ma_resolta'; equipGuanyador: Equip | null; punts: number; motiu: MotiuFiMa }
  | { tipus: 'truc_cantat'; equip: Equip; valorProposat: 2 | 3 }
  | { tipus: 'truc_resolt'; equip: Equip; accepta: boolean }
  | { tipus: 'ma11_pendent'; equip: Equip }
  | { tipus: 'ma11_resolta'; equip: Equip; vol: boolean }
  | { tipus: 'ma_repartida' }
  | { tipus: 'partida_acabada'; equipGuanyador: Equip };
