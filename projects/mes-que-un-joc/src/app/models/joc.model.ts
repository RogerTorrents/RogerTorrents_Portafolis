export type JocId = 'joc1' | 'joc2' | 'joc3' | 'joc4';

export const JOCS_IDS: readonly JocId[] = ['joc1', 'joc2', 'joc3', 'joc4'];

export const VIDES_INICIALS = 5;
export const RONDES_PER_COMPLETAR = 10;
export const ESTRELLES_MAXIMES_PER_EPOCA = VIDES_INICIALS * JOCS_IDS.length;
