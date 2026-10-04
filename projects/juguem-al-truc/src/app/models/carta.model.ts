export type Coll = 'oros' | 'copes' | 'espases' | 'bastos';

export interface Carta {
  readonly id: string;
  readonly coll: Coll;
  readonly valor: number; // 1..12
}

const ORDRE_FORCA: readonly number[] = [3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5, 4];

// Sense la ç de "força": als templates Angular les propietats amb ç trenquen el binding.
export function forcaCarta(valor: number): number {
  const index = ORDRE_FORCA.indexOf(valor);
  return ORDRE_FORCA.length - index;
}

const NOMS_FIGURES: Readonly<Record<number, string>> = { 1: 'As', 10: 'Sota', 11: 'Cavall', 12: 'Rei' };

/** Nom tradicional de la baralla espanyola (As/Sota/Cavall/Rei) o el número tal qual. */
export function etiquetaValor(valor: number): string {
  return NOMS_FIGURES[valor] ?? String(valor);
}

/** Imatge real de la carta a `public/truc/baralla-espanyola/` (p.ex. `oros_03.png`). */
export function rutaImatgeCarta(carta: Carta): string {
  const valor = String(carta.valor).padStart(2, '0');
  return `/truc/baralla-espanyola/${carta.coll}_${valor}.png`;
}

