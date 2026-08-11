export type TitolId =
  | 'lliga'
  | 'copa'
  | 'supercopa_espanya'
  | 'champions'
  | 'supercopa_europa'
  | 'mundial_clubs';

export interface DefinicioTitol {
  readonly id: TitolId;
  readonly nomKey: string;
}

export const TOTS_ELS_TITOLS: readonly DefinicioTitol[] = [
  { id: 'lliga', nomKey: 'titol_lliga' },
  { id: 'copa', nomKey: 'titol_copa' },
  { id: 'supercopa_espanya', nomKey: 'titol_supercopa_espanya' },
  { id: 'champions', nomKey: 'titol_champions' },
  { id: 'supercopa_europa', nomKey: 'titol_supercopa_europa' },
  { id: 'mundial_clubs', nomKey: 'titol_mundial_clubs' },
];
