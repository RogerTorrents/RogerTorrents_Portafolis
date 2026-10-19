import { Injectable, signal } from '@angular/core';
import { Idioma, TextTraduit } from '../models/projecte.model';

function esIdiomaValid(valor: unknown): valor is Idioma {
  return valor === 'ca' || valor === 'es' || valor === 'en';
}

/**
 * Servei de traduccions d'Altres projectes. L'idioma el controla el selector
 * de la barra de tasques del Shell (postMessage, veure constructor) — no hi ha
 * cap selector propi dins de l'app. El default 'ca' només s'aplica si l'app
 * s'obre sola (fora de l'iframe del Shell, p. ex. en desenvolupament).
 */
@Injectable({ providedIn: 'root' })
export class TraduccioService {
  readonly idioma = signal<Idioma>('ca');

  constructor() {
    window.addEventListener('message', (ev: MessageEvent) => {
      const dades = ev.data as { origen?: unknown; tipus?: unknown; valor?: unknown } | null;
      if (dades?.origen === 'os-shell' && dades.tipus === 'idioma' && esIdiomaValid(dades.valor)) {
        this.establirIdioma(dades.valor);
      }
    });
  }

  private readonly dict: Record<Idioma, Record<string, string>> = {
    ca: {
      titol: 'Altres projectes',
      lema: 'Webs que he fet a mida per a gent i projectes propers.',
      obrir: 'Obrir la web',
      provar: 'Provar-la aquí',
      nova_pestanya: '(s’obre en una pestanya nova)',
      captura: 'Captura de {0}',
      captura_mobil: '{0} al mòbil',
      tancar: 'Tancar',
      escriptori: 'Escriptori',
      mobil: 'Mòbil',
      mida: 'Mida de la pantalla',
      carregant: 'Carregant la web…',
      marc: 'Web en directe: {0}',
    },
    es: {
      titol: 'Otros proyectos',
      lema: 'Webs que he hecho a medida para gente y proyectos cercanos.',
      obrir: 'Abrir la web',
      provar: 'Probarla aquí',
      nova_pestanya: '(se abre en una pestaña nueva)',
      captura: 'Captura de {0}',
      captura_mobil: '{0} en el móvil',
      tancar: 'Cerrar',
      escriptori: 'Escritorio',
      mobil: 'Móvil',
      mida: 'Tamaño de la pantalla',
      carregant: 'Cargando la web…',
      marc: 'Web en directo: {0}',
    },
    en: {
      titol: 'Other projects',
      lema: 'Websites I made to measure for people and projects close to me.',
      obrir: 'Open the website',
      provar: 'Try it here',
      nova_pestanya: '(opens in a new tab)',
      captura: 'Screenshot of {0}',
      captura_mobil: '{0} on a phone',
      tancar: 'Close',
      escriptori: 'Desktop',
      mobil: 'Phone',
      mida: 'Screen size',
      carregant: 'Loading the website…',
      marc: 'Live website: {0}',
    },
  };

  establirIdioma(idioma: Idioma): void {
    this.idioma.set(idioma);
    document.documentElement.lang = idioma;
  }

  /** Text de la interfície. Els `{0}`, `{1}`… se substitueixen pels arguments. */
  t(clau: string, ...args: readonly (string | number)[]): string {
    const text = this.dict[this.idioma()][clau] ?? clau;
    return args.reduce<string>((acc, arg, i) => acc.replace(`{${i}}`, String(arg)), text);
  }

  /** Tria la versió d'un text de dades en l'idioma actual. */
  tx(text: TextTraduit): string {
    return text[this.idioma()];
  }
}
