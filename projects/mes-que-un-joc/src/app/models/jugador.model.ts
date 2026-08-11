export type Posicio = 'porter' | 'defensa' | 'migcampista' | 'davanter';

export interface Jugador {
  readonly id: string;
  readonly nom: string;
  readonly posicio: Posicio;
  /** Minuts totals aproximats vestint la samarreta del primer equip. */
  readonly minutsClub: number;
  readonly anyDebut: number;
  /** Any de la darrera temporada al club (any actual si encara hi juga). */
  readonly anyRetirada: number;
}
