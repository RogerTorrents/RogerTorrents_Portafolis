export type Personatge = 'pere' | 'marina' | 'paula' | 'andreu';
export type Equip = 'A' | 'B';

/**
 * Anell fix de seients (0-3): Pere+Paula (equip A) seuen sempre oposats a
 * Marina+Andreu (equip B). El mateix ordre marca el sentit del torn.
 */
export const PERSONATGES: readonly Personatge[] = ['pere', 'marina', 'paula', 'andreu'];

const EQUIP_PER_SEIENT: readonly Equip[] = ['A', 'B', 'A', 'B'];

export function seientDePersonatge(personatge: Personatge): number {
  return PERSONATGES.indexOf(personatge);
}

export function personatgeDeSeient(seient: number): Personatge {
  return PERSONATGES[seient];
}

export function equipDeSeient(seient: number): Equip {
  return EQUIP_PER_SEIENT[seient];
}

export function seientsDeLEquip(equip: Equip): readonly [number, number] {
  return equip === 'A' ? [0, 2] : [1, 3];
}

/** Nom tal com apareix als fitxers d'assets (`Pere`, `Marina`...) — capitalitzat, a diferència del valor intern del model. */
export function nomFitxerPersonatge(personatge: Personatge): string {
  return personatge.charAt(0).toUpperCase() + personatge.slice(1);
}
