import type { Entrenament } from './entrenament.model';

export interface Assignacio {
  readonly id: string;
  readonly plaId: string;
  readonly entrenamentId: string;
  readonly usuariId: string;
  /** 'YYYY-MM-DD'. */
  readonly data: string;
  readonly completat: boolean;
  readonly completatEl: string | null;
  readonly creatEl: string;
}

export interface AssignacioAmbEntrenament extends Assignacio {
  readonly entrenament: Entrenament;
}

export type DiaSetmana =
  | 'DILLUNS'
  | 'DIMARTS'
  | 'DIMECRES'
  | 'DIJOUS'
  | 'DIVENDRES'
  | 'DISSABTE'
  | 'DIUMENGE';

export const DIES_SETMANA: readonly DiaSetmana[] = [
  'DILLUNS',
  'DIMARTS',
  'DIMECRES',
  'DIJOUS',
  'DIVENDRES',
  'DISSABTE',
  'DIUMENGE',
];

export interface CrearAssignacioPayload {
  readonly entrenamentId: string;
  readonly data: string;
}

export interface CrearAssignacioMassivaPayload {
  readonly entrenamentId: string;
  readonly diaSetmana: DiaSetmana;
  readonly desDe?: string;
}

export interface ActualitzarAssignacioPayload {
  readonly data?: string;
  readonly completat?: boolean;
}
