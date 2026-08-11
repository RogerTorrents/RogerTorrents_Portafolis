import type { Coordenades } from './poi.model';

/**
 * Lloc creat per un usuari dins d'una de les seves categories personals.
 * En producció: col·lecció MongoDB `llocs_personals`, amb `coordenades` com a
 * `GeoJSON Point` (índex `2dsphere`) per permetre cerques geoespacials.
 */
export interface LlocPersonal {
  readonly id: string;
  readonly usuariId: string;
  readonly categoriaId: string;
  readonly nom: string;
  readonly coordenades: Coordenades;
  readonly descripcio: string;
}
