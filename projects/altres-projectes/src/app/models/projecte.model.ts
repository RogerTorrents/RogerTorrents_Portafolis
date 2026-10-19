export type Idioma = 'ca' | 'es' | 'en';

/** Un text escrit en els tres idiomes de l'app. */
export type TextTraduit = Readonly<Record<Idioma, string>>;

/** Colors de la targeta, presos de la identitat de la mateixa web. */
export interface ColorsProjecte {
  readonly fons: string;
  readonly text: string;
  /** Color dels botons i dels detalls destacats. */
  readonly accent: string;
  /** Color del text dins dels botons d'accent. */
  readonly textAccent: string;
}

/**
 * Una web feta a mida. Per afegir-ne una de nova només cal afegir una entrada
 * a `PROJECTES` (data/projectes.data.ts) i les captures a `public/projectes/<id>/`.
 */
export interface Projecte {
  /** Identificador kebab-case; també és el nom de la carpeta de captures. */
  readonly id: string;
  readonly nom: string;
  readonly url: string;
  /** Frase completa: "Per a …". */
  readonly perA: TextTraduit;
  /** Una sola frase que explica la web. */
  readonly resum: TextTraduit;
  /** Tres coses que fa, molt curtes. */
  readonly destacats: readonly TextTraduit[];
  /** Avís curt per a qui la visita (p. ex. privacitat). */
  readonly nota?: TextTraduit;
  readonly stack: readonly string[];
  /** Captura d'escriptori 1280×800. */
  readonly captura: string;
  /** Captura de mòbil 390×844. */
  readonly capturaMobil: string;
  readonly colors: ColorsProjecte;
  /** Si la web es pot incrustar i provar dins de l'app. */
  readonly emprovable: boolean;
}
