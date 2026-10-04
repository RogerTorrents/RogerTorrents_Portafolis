import { Equip, seientsDeLEquip } from '../models/personatge.model';
import { JugadorPublic } from '../models/sala.model';

export type PosicioTaula = 'baix' | 'esquerra' | 'dalt' | 'dreta';

const POSICIONS: readonly PosicioTaula[] = ['baix', 'esquerra', 'dalt', 'dreta'];

/**
 * Cada jugador es veu sempre a si mateix assegut a baix de la pantalla
 * ("la cadira interior"), independentment del seient absolut (0-3) que li
 * hagi tocat al servidor. `dalt` és sempre la parella (seient+2, ja que
 * l'anell de seients té les parelles oposades); `esquerra`/`dreta` són els
 * rivals.
 */
export function posicioRelativa(seientAbsolut: number, elMeuSeient: number): PosicioTaula {
  const desplacament = (seientAbsolut - elMeuSeient + 4) % 4;
  return POSICIONS[desplacament];
}

/** Noms reals dels 2 jugadors d'un equip (no els noms fixos dels personatges) — p.ex. "Tester / Paula". */
export function nomEquip(jugadors: readonly (JugadorPublic | null)[], equip: Equip): string {
  const [s1, s2] = seientsDeLEquip(equip);
  return [jugadors[s1]?.nom, jugadors[s2]?.nom].filter((nom): nom is string => !!nom).join(' / ');
}
