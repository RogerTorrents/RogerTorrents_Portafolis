import type { Regio } from '../models/regio.model';

/**
 * Zones predefinides del selector de mapes. `nomClau` referencia una clau
 * de traducció gestionada per `TraduccioService`.
 */
export const REGIONS: readonly Regio[] = [
  { id: 'catalunya', nomClau: 'regio_catalunya', centre: [41.8204, 1.6976], zoom: 8 },
  { id: 'pirineus', nomClau: 'regio_pirineus', centre: [42.5667, 1.0], zoom: 10 },
  { id: 'sant-pere-de-ribes', nomClau: 'regio_garraf', centre: [41.2612, 1.7712], zoom: 13 },
  { id: 'montseny', nomClau: 'regio_montseny', centre: [41.7658, 2.4356], zoom: 12 },
];
