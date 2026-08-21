import type { EntrenamentPredefinit } from './entrenament.model';

export interface PlaPredefinit {
  readonly id: string;
  readonly nom: string;
  readonly descripcio: string;
  readonly durationSetmanes: number;
  readonly ordre: number;
  readonly creatEl: string;
}

export interface PlaPredefinitAmbEntrenaments extends PlaPredefinit {
  readonly entrenamentsPredefinits: readonly EntrenamentPredefinit[];
}
