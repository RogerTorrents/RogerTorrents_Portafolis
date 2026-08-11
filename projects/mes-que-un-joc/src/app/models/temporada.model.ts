import { TitolId } from './titol.model';

export interface JugadorTemporada {
  readonly jugadorId: string;
  readonly dorsal: number;
}

export interface Temporada {
  /** Identificador tipus '2014-15'. */
  readonly id: string;
  readonly anyInici: number;
  readonly titols: readonly TitolId[];
  /** Onze inicial representatiu d'aquella temporada. */
  readonly alineacio: readonly JugadorTemporada[];
}
