/**
 * Categoria pròpia creada per un usuari registrat (ex. "Llocs on he viatjat").
 * En producció: col·lecció MongoDB `categories_personals`, referenciant
 * `usuariId` (id SQL de l'usuari propietari).
 */
export interface CategoriaPersonal {
  readonly id: string;
  readonly usuariId: string;
  readonly nom: string;
  readonly color: string;
  readonly icona: string;
}

export const COLORS_CATEGORIA_DISPONIBLES: readonly string[] = [
  '#e8622f',
  '#d1a13c',
  '#d8564f',
  '#4fa3c7',
  '#9a86c9',
  '#6ba86f',
  '#3f9e8f',
];

export const ICONES_CATEGORIA_DISPONIBLES: readonly string[] = ['★', '♥', '✈', '⛺', '📷', '🍽', '🚩'];
