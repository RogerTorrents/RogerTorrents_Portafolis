import { Jugador, Posicio } from '../models/jugador.model';

/** Ordre tàctic: porter, després defenses, migcampistes i davanters. */
const ORDRE_POSICIONS: readonly Posicio[] = ['porter', 'defensa', 'migcampista', 'davanter'];

export interface FilaPosicio {
  readonly posicio: Posicio;
  readonly jugadors: readonly Jugador[];
}

/** Agrupa jugadors en files per posició, seguint l'ordre tàctic habitual. */
export function agruparPerPosicio(jugadors: readonly Jugador[]): readonly FilaPosicio[] {
  return ORDRE_POSICIONS.map(posicio => ({
    posicio,
    jugadors: jugadors.filter(j => j.posicio === posicio),
  })).filter(fila => fila.jugadors.length > 0);
}
