/**
 * Catàleg d'exercicis de gym per part del cos, usat pel selector visual de
 * `editor-entrenament` (component `exercici-gym-fila`) i per les vistes de
 * detall (`detall-entrenament-dades`, `veure-entrenament`). Purament dades
 * de UI per ajudar a triar un nom d'exercici — mai es persisteix el grup
 * muscular ni l'id del catàleg, només `ExerciciGym.nom` (text lliure), per
 * no obligar a canviar l'esquema del backend. En tornar a editar/veure un
 * exercici ja creat, `trobarExerciciPerNom` reconstrueix quin grup/foto li
 * pertoquen buscant el nom dins de tot el catàleg.
 *
 * Les imatges viuen a `public/exercicis/<imatge>` (arrel d'aquesta app,
 * NO l'arrel del Shell — es couen amb `ng serve som-hi`/build de l'app).
 * Fotos reals afegides el 2026-08-21 (42, una per exercici).
 */

export type GrupMuscular =
  | 'CAMES'
  | 'GLUTIS'
  | 'PIT'
  | 'ESQUENA'
  | 'ESPATLLES'
  | 'BRACOS'
  | 'ABDOMINALS'
  | 'ALTRE';

export const GRUPS_MUSCULARS: readonly GrupMuscular[] = [
  'CAMES',
  'GLUTIS',
  'PIT',
  'ESQUENA',
  'ESPATLLES',
  'BRACOS',
  'ABDOMINALS',
  'ALTRE',
];

export interface ExerciciCatalog {
  readonly id: string;
  readonly nom: string;
  readonly imatge: string;
}

type GrupAmbCataleg = Exclude<GrupMuscular, 'ALTRE'>;

export const EXERCICIS_PER_GRUP: Record<GrupAmbCataleg, readonly ExerciciCatalog[]> = {
  CAMES: [
    { id: 'sentadilla', nom: 'Sentadilla', imatge: 'sentadilla.jpg' },
    { id: 'zancada', nom: 'Zancada', imatge: 'zancada.jpg' },
    { id: 'premsa-cames', nom: 'Premsa de cames', imatge: 'premsa-cames.jpg' },
    { id: 'extensio-quadriceps', nom: 'Extensió de quàdriceps', imatge: 'extensio-quadriceps.jpg' },
    { id: 'femoral', nom: 'Femoral (corba de cames)', imatge: 'femoral.jpg' },
    { id: 'gemelts', nom: 'Elevació de gemelts', imatge: 'gemelts.jpg' },
    { id: 'salt-a-banc', nom: 'Salt a banc', imatge: 'salt-a-banc.jpg' },
    { id: 'aduccio-maquina', nom: 'Adducció a màquina', imatge: 'aduccio-maquina.jpg' },
  ],
  GLUTIS: [
    { id: 'hip-thrust', nom: 'Hip thrust', imatge: 'hip-thrust.jpg' },
    { id: 'pes-mort', nom: 'Pes mort', imatge: 'pes-mort.jpg' },
    { id: 'patada-de-gluti', nom: 'Patada de gluti (kickback)', imatge: 'patada-de-gluti.jpg' },
    { id: 'abduccio-maquina', nom: 'Abducció a màquina', imatge: 'abduccio-maquina.jpg' },
  ],
  PIT: [
    { id: 'press-banca', nom: 'Press de banca', imatge: 'press-banca.jpg' },
    { id: 'press-inclinat', nom: 'Press inclinat', imatge: 'press-inclinat.jpg' },
    { id: 'obertures-maquina', nom: 'Obertures a màquina', imatge: 'obertures-maquina.jpg' },
    { id: 'pres-pit-iso-lateral', nom: 'Press de pit iso-lateral', imatge: 'pres-pit-iso-lateral.jpg' },
    { id: 'press-banca-mancuerna', nom: 'Press de banca amb mancurnes', imatge: 'press-banca-mancuerna.jpg' },
    { id: 'flexions', nom: 'Flexions', imatge: 'flexions.jpg' },
  ],
  ESQUENA: [
    { id: 'dominades', nom: 'Dominades', imatge: 'dominades.jpg' },
    { id: 'remo-iso-lateral', nom: 'Remo iso-lateral', imatge: 'remo-iso-lateral.jpg' },
    { id: 'jalon-al-pit', nom: 'Jalón al pit', imatge: 'jalon-al-pit.jpg' },
    { id: 'remo-sentat-cable', nom: 'Remo assegut a la politja', imatge: 'remo-sentat-cable.jpg' },
    { id: 'remo-amb-mancuerna', nom: 'Remo amb mancurna', imatge: 'remo-amb-mancuerna.jpg' },
    {
      id: 'jalon-dorsals-bracos-rectes-polea',
      nom: 'Jalón de dorsals amb braços rectes a la politja',
      imatge: 'jalon-dorsals-bracos-rectes-polea.jpg',
    },
  ],
  ESPATLLES: [
    { id: 'press-militar-mancuerna-sentat', nom: 'Press militar amb mancurnes, assegut', imatge: 'press-militar-mancuerna-sentat.jpg' },
    { id: 'press-militar-maquina-sentat', nom: 'Press militar a màquina, assegut', imatge: 'press-militar-maquina-sentat.jpg' },
    { id: 'elevacions-laterals-mancuerna', nom: 'Elevacions laterals amb mancurnes', imatge: 'elevacions-laterals-mancuerna.jpg' },
    { id: 'elevacions-laterals-polea', nom: 'Elevacions laterals a la politja', imatge: 'elevacions-laterals-polea.jpg' },
    { id: 'elevacions-frontals-mancuerna', nom: 'Elevacions frontals amb mancurnes', imatge: 'elevacions-frontals-mancuerna.jpg' },
    { id: 'elevacions-laterals-maquina', nom: 'Elevacions laterals a màquina', imatge: 'elevacions-laterals-maquina.jpg' },
  ],
  BRACOS: [
    { id: 'curl-biceps-cable', nom: 'Curl de bíceps al cable', imatge: 'curl-biceps-cable.jpg' },
    { id: 'curl-predicador-barra', nom: 'Curl predicador amb barra', imatge: 'curl-predicador-barra.jpg' },
    { id: 'curl-martell-mancuerna', nom: 'Curl martell amb mancurnes', imatge: 'curl-martell-mancuerna.png' },
    { id: 'curl-biceps-mancuerna', nom: 'Curl de bíceps amb mancurnes', imatge: 'curl-biceps-mancuerna.jpg' },
    { id: 'extensio-triceps-polea', nom: 'Extensió de tríceps a la politja', imatge: 'extensio-triceps-polea.jpg' },
    { id: 'fondos-triceps', nom: 'Fondos de tríceps', imatge: 'fondos-triceps.jpg' },
  ],
  ABDOMINALS: [
    { id: 'crunch', nom: 'Crunch', imatge: 'crunch.jpg' },
    { id: 'plancha', nom: 'Plancha', imatge: 'plancha.jpg' },
    { id: 'elevacio-cames', nom: 'Elevació de cames', imatge: 'elevacio-cames.jpg' },
    { id: 'russian-twist', nom: 'Russian twist', imatge: 'russian-twist.jpg' },
    { id: 'abdominals-maquina', nom: 'Abdominals a màquina', imatge: 'abdominals-maquina.jpg' },
    { id: 'mountain-climber', nom: 'Mountain climber', imatge: 'mountain-climber.jpg' },
  ],
};

/** Cerca un exercici del catàleg pel seu nom exacte (per re-suggerir grup+foto en editar/veure). */
export function trobarExerciciPerNom(
  nom: string,
): { grup: GrupAmbCataleg; exercici: ExerciciCatalog } | null {
  for (const grup of Object.keys(EXERCICIS_PER_GRUP) as GrupAmbCataleg[]) {
    const exercici = EXERCICIS_PER_GRUP[grup].find((e) => e.nom === nom);
    if (exercici) return { grup, exercici };
  }
  return null;
}
