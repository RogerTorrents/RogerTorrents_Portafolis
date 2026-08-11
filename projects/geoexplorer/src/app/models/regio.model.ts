import type { Coordenades, IdRegio } from './poi.model';

/** Definició d'una zona/mapa navegable des del selector de regions. */
export interface Regio {
  readonly id: IdRegio;
  readonly nomClau: string;
  readonly centre: Coordenades;
  readonly zoom: number;
}
