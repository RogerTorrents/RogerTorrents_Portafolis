/** Enter aleatori entre min i max, ambdós inclosos. */
export function enterAleatori(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Retorna un element aleatori d'un array (assumeix array no buit). */
export function triarAleatori<T>(llista: readonly T[]): T {
  return llista[enterAleatori(0, llista.length - 1)];
}

/** Barreja (Fisher-Yates) sense mutar l'array original. */
export function barrejar<T>(llista: readonly T[]): T[] {
  const copia = [...llista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = enterAleatori(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Tria `n` elements diferents d'una llista (sense repetició), opcionalment excloent-ne un. */
export function triarNDiferents<T>(llista: readonly T[], n: number, exclos?: T): T[] {
  const candidats = exclos === undefined ? llista : llista.filter(item => item !== exclos);
  return barrejar(candidats).slice(0, n);
}
