import type { Dificultat, TipusPoi } from './poi.model';

/** Estat complet del panell de filtres dinàmics. */
export interface FiltresEstat {
  readonly categories: ReadonlySet<TipusPoi>;
  readonly altitudMin: number;
  readonly altitudMax: number;
  readonly dificultats: ReadonlySet<Dificultat>;
  readonly cercaText: string;
}

export const ALTITUD_ABSOLUTA_MIN = 0;
export const ALTITUD_ABSOLUTA_MAX = 3500;

export const TOTES_LES_CATEGORIES: readonly TipusPoi[] = ['pic', 'refugi', 'llac', 'parking'];
export const TOTES_LES_DIFICULTATS: readonly Dificultat[] = ['facil', 'mitjana', 'dificil', 'tecnica'];

export function filtresPerDefecte(): FiltresEstat {
  return {
    categories: new Set(TOTES_LES_CATEGORIES),
    altitudMin: ALTITUD_ABSOLUTA_MIN,
    altitudMax: ALTITUD_ABSOLUTA_MAX,
    dificultats: new Set(TOTES_LES_DIFICULTATS),
    cercaText: '',
  };
}
