/** Mirall exacte dels DTOs de `som-hi-api` (src/common/dto/dades-entrenament.dto.ts). */

export type Modalitat = 'CORRER' | 'BICI' | 'GYM' | 'PILATES' | 'PISCINA' | 'ALTRE';

export const MODALITATS: readonly Modalitat[] = [
  'CORRER',
  'BICI',
  'GYM',
  'PILATES',
  'PISCINA',
  'ALTRE',
];

export type ZonaEntrenament = 'SUAU' | 'MODERAT' | 'LLINDAR' | 'SERIES' | 'CURSA';

export const ZONES_ENTRENAMENT: readonly ZonaEntrenament[] = [
  'SUAU',
  'MODERAT',
  'LLINDAR',
  'SERIES',
  'CURSA',
];

export type TerrenyEntrenament = 'PLA' | 'MIG' | 'PUJADES';

export const TERRENYS_ENTRENAMENT: readonly TerrenyEntrenament[] = ['PLA', 'MIG', 'PUJADES'];

export interface DadesCorrer {
  readonly modalitat: 'CORRER';
  readonly zona: ZonaEntrenament;
  readonly km: number;
  readonly tempsMinuts: number;
  readonly polsacionsMaximes?: number;
  readonly terreny?: TerrenyEntrenament;
}

export interface DadesBici {
  readonly modalitat: 'BICI';
  readonly km: number;
  readonly tempsMinuts: number;
}

export interface ExerciciGym {
  readonly nom: string;
  readonly series: number;
  readonly repeticions: number;
  readonly tempsSegons?: number;
  readonly pesQuilos?: number;
}

export interface DadesGym {
  readonly modalitat: 'GYM';
  readonly exercicis: readonly ExerciciGym[];
}

export interface DadesPilates {
  readonly modalitat: 'PILATES';
  readonly exercici: string;
  readonly linkVideo?: string;
}

export interface DadesPiscina {
  readonly modalitat: 'PISCINA';
  readonly distanciaMetres: number;
  readonly tempsMinuts: number;
}

export interface DadesAltre {
  readonly modalitat: 'ALTRE';
  readonly descripcio: string;
  readonly tempsMinuts?: number;
}

export type DadesEntrenament =
  | DadesCorrer
  | DadesBici
  | DadesGym
  | DadesPilates
  | DadesPiscina
  | DadesAltre;

export interface Entrenament {
  readonly id: string;
  readonly plaId: string;
  readonly usuariId: string;
  readonly modalitat: Modalitat;
  readonly titol: string;
  readonly dades: DadesEntrenament;
  readonly creatEl: string;
  readonly actualitzatEl: string;
}

export interface EntrenamentPredefinit {
  readonly id: string;
  readonly plaPredefinitId: string;
  readonly diaOffset: number;
  readonly modalitat: Modalitat;
  readonly titol: string;
  readonly dades: DadesEntrenament;
  readonly ordre: number;
}

export interface CrearEntrenamentPayload {
  readonly titol: string;
  readonly modalitat: Modalitat;
  readonly dades: DadesEntrenament;
}

export type ActualitzarEntrenamentPayload = Partial<CrearEntrenamentPayload>;
