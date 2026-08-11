import * as L from 'leaflet';
import type { Poi, TipusPoi } from '../models/poi.model';
import type { CategoriaPersonal } from '../models/categoria-personal.model';

interface AparencaTipus {
  readonly color: string;
  readonly simbol: string;
}

const APARENCA_PER_TIPUS: Record<TipusPoi, AparencaTipus> = {
  pic: { color: '#e8622f', simbol: '▲' },
  refugi: { color: '#4fa3c7', simbol: '⌂' },
  llac: { color: '#3f9e8f', simbol: '≈' },
  parking: { color: '#9a86c9', simbol: 'P' },
};

/** Icones amb forma de fita (pin), una per tipus — es reutilitza la mateixa
 * instància a tots els marcadors del mateix tipus en lloc de crear-ne una de
 * nova per marcador a cada redibuixat (menys al·locacions amb 100+ POIs). */
const ICONES_POI_PER_TIPUS = new Map<TipusPoi, L.DivIcon>();

/** Crea (o reutilitza) la icona en forma de fita (pin) diferenciada per tipus de POI. */
export function creaIconaPoi(poi: Poi): L.DivIcon {
  const existent = ICONES_POI_PER_TIPUS.get(poi.tipus);
  if (existent) return existent;

  const { color, simbol } = APARENCA_PER_TIPUS[poi.tipus];
  const icona = L.divIcon({
    className: '',
    html: `
      <svg class="geo-marcador-icona" viewBox="0 0 24 30" width="26" height="32">
        <path d="M12 29C12 29 2 18.6 2 11A10 10 0 0 1 22 11C22 18.6 12 29 12 29Z" fill="${color}" />
        <circle cx="12" cy="11" r="6.5" fill="rgba(16,24,35,0.35)" />
        <text x="12" y="14.2" text-anchor="middle" class="geo-marcador-simbol">${simbol}</text>
      </svg>
    `,
    iconSize: [26, 32],
    iconAnchor: [13, 31],
    popupAnchor: [0, -28],
  });
  ICONES_POI_PER_TIPUS.set(poi.tipus, icona);
  return icona;
}

/** Icona per al punt resultant d'una cerca per coordenades (`Capcalera`). */
export function creaIconaCercada(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: '<div class="geo-marcador-cercat"><span class="geo-marcador-cercat-pols"></span><span class="geo-marcador-cercat-punt"></span></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

/** Icona rodona (no en forma de pin) per als llocs propis d'un usuari, en el color de la seva categoria. */
export function creaIconaLlocPersonal(categoria: CategoriaPersonal): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="geo-marcador-personal" style="background:${categoria.color}"><span>${categoria.icona}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}
