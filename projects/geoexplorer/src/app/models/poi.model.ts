/**
 * Model de dades dels Punts d'Interès (POI) de GeoExplorer.
 * Unió discriminada per `tipus`: cada variant té els atributs propis del seu domini.
 */

export type TipusPoi = 'pic' | 'refugi' | 'llac' | 'parking';

export type Dificultat = 'facil' | 'mitjana' | 'dificil' | 'tecnica';

export type Capacitat = 'baixa' | 'mitjana' | 'alta';

export type Servei = 'aigua' | 'menjar' | 'llits' | 'wc' | 'dutxa' | 'electricitat';

export type IdRegio = 'catalunya' | 'pirineus' | 'sant-pere-de-ribes' | 'montseny';

/** Coordenades [latitud, longitud], format Leaflet. */
export type Coordenades = readonly [number, number];

interface PoiBase {
  readonly id: string;
  readonly nom: string;
  readonly regio: IdRegio;
  readonly coordenades: Coordenades;
  readonly descripcio: string;
  readonly imatges: readonly string[];
}

export interface PicPoi extends PoiBase {
  readonly tipus: 'pic';
  readonly altitud: number;
  readonly dificultat: Dificultat;
}

export interface RefugiPoi extends PoiBase {
  readonly tipus: 'refugi';
  readonly altitud: number;
  readonly guardat: boolean;
  readonly obert: boolean;
  readonly serveis: readonly Servei[];
  readonly telefon?: string;
}

export interface LlacPoi extends PoiBase {
  readonly tipus: 'llac';
  readonly altitud: number;
}

export interface ParkingPoi extends PoiBase {
  readonly tipus: 'parking';
  readonly gratuit: boolean;
  readonly capacitat: Capacitat;
}

export type Poi = PicPoi | RefugiPoi | LlacPoi | ParkingPoi;

/** Type guards per accedir a atributs específics de cada variant sense `any`. */
export function esPic(poi: Poi): poi is PicPoi {
  return poi.tipus === 'pic';
}
export function esRefugi(poi: Poi): poi is RefugiPoi {
  return poi.tipus === 'refugi';
}
export function esLlac(poi: Poi): poi is LlacPoi {
  return poi.tipus === 'llac';
}
export function esParking(poi: Poi): poi is ParkingPoi {
  return poi.tipus === 'parking';
}

/** Retorna l'altitud del POI quan el tipus en té; `null` en cas contrari (ex. parking). */
export function altitudDe(poi: Poi): number | null {
  if (esPic(poi) || esRefugi(poi) || esLlac(poi)) return poi.altitud;
  return null;
}
