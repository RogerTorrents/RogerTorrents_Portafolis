import { Projecte } from '../models/projecte.model';

/**
 * Webs fetes a mida, en l'ordre en què es mostren.
 *
 * Per afegir una web nova:
 *   1. Desa `inici.jpg` (1280×800) i `mobil.jpg` (390×844) a `public/projectes/<id>/`.
 *   2. Afegeix una entrada al final d'aquest array.
 */
export const PROJECTES: readonly Projecte[] = [
  {
    id: 'espais-inclusius',
    nom: 'Espais inclusius',
    url: 'https://espais-inclusius.web.app/',
    perA: {
      ca: 'Per a la Jordina, la meva germana',
      es: 'Para Jordina, mi hermana',
      en: 'For Jordina, my sister',
    },
    resum: {
      ca: 'La web del seu treball de recerca: es pot millorar la inclusió de les persones amb TEA?',
      es: 'La web de su trabajo de investigación: ¿se puede mejorar la inclusión de las personas con TEA?',
      en: 'The website for her research project: can the inclusion of autistic people be improved?',
    },
    destacats: [
      {
        ca: '15 experiències d’èxit, amb filtre i cercador',
        es: '15 experiencias de éxito, con filtro y buscador',
        en: '15 success stories, with filter and search',
      },
      {
        ca: 'Qüestionari a 33 famílies i una entrevista',
        es: 'Cuestionario a 33 familias y una entrevista',
        en: 'A survey of 33 families and an interview',
      },
      {
        ca: 'El treball complet en PDF',
        es: 'El trabajo completo en PDF',
        en: 'The full research paper as a PDF',
      },
    ],
    stack: ['Angular', 'Firebase'],
    captura: 'projectes/espais-inclusius/inici.jpg',
    capturaMobil: 'projectes/espais-inclusius/mobil.jpg',
    colors: { fons: '#d6e4ff', text: '#0b1530', accent: '#1d4ed8', textAccent: '#ffffff' },
    emprovable: true,
  },
  {
    id: 'delta-konkurs',
    nom: 'Delta-Konkurs',
    url: 'https://lustrous-crisp-522663.netlify.app/',
    perA: {
      ca: 'Per a l’Esplai GER',
      es: 'Para el Esplai GER',
      en: 'For Esplai GER youth club',
    },
    resum: {
      ca: 'El marcador de les dinàmiques d’una estada de l’esplai, per fer servir des del mòbil i projectar.',
      es: 'El marcador de las dinámicas de una estancia del esplai, para usar desde el móvil y proyectar.',
      en: 'The scoreboard for the games on a youth club trip, used from a phone and shown on a big screen.',
    },
    destacats: [
      {
        ca: 'Punts i classificació, general i per dia',
        es: 'Puntos y clasificación, general y por día',
        en: 'Points and rankings, overall and daily',
      },
      {
        ca: 'Ruleta de penyores i avantatges',
        es: 'Ruleta de prendas y ventajas',
        en: 'A wheel of forfeits and perks',
      },
      {
        ca: 'Equips aleatoris i presentació de campions',
        es: 'Equipos aleatorios y presentación de campeones',
        en: 'Random teams and a champions’ showcase',
      },
    ],
    nota: {
      ca: 'Versió pública sense participants, per la privacitat dels infants.',
      es: 'Versión pública sin participantes, por la privacidad de los niños.',
      en: 'Public version with no participants, to protect the children’s privacy.',
    },
    stack: ['JavaScript', 'Tailwind', 'Firebase'],
    captura: 'projectes/delta-konkurs/inici.jpg',
    capturaMobil: 'projectes/delta-konkurs/mobil.jpg',
    colors: { fons: '#0b1222', text: '#f1f5f9', accent: '#22d3ee', textAccent: '#0b1222' },
    emprovable: true,
  },
];
