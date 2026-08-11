export type EpocaId = 'sempre' | 'y2000' | 'y2015';

export interface Epoca {
  readonly id: EpocaId;
  /** Any mínim (inclòs) per filtrar temporades/jugadors. `null` = sense filtre. */
  readonly anyMinim: number | null;
  readonly nomKey: string;
}

export const EPOQUES: readonly Epoca[] = [
  { id: 'sempre', anyMinim: null, nomKey: 'epoca_sempre' },
  { id: 'y2000', anyMinim: 2000, nomKey: 'epoca_2000' },
  { id: 'y2015', anyMinim: 2015, nomKey: 'epoca_2015' },
];
