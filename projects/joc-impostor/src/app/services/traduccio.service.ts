import { Injectable, signal } from '@angular/core';

export type IdiomaUi = 'ca' | 'es' | 'en';

function esIdiomaValid(valor: unknown): valor is IdiomaUi {
  return valor === 'ca' || valor === 'es' || valor === 'en';
}

/**
 * Servei de traduccions de L'Impostor. L'idioma de la interfície el controla
 * el selector de la barra de l'escriptori del Shell (postMessage, veure
 * constructor). No confondre amb el selector "Idioma" de la configuració,
 * que és l'idioma en què l'IA genera les paraules. El default 'ca' només
 * s'aplica si l'app s'obre sola (fora de l'iframe del Shell).
 */
@Injectable({ providedIn: 'root' })
export class TraduccioService {
  readonly idioma = signal<IdiomaUi>('ca');

  constructor() {
    window.addEventListener('message', (ev: MessageEvent) => {
      // Només el Shell (la finestra que incrusta l'app) pot canviar l'idioma.
      if (ev.source !== window.parent || window.parent === window) return;
      const dades = ev.data as { origen?: unknown; tipus?: unknown; valor?: unknown } | null;
      if (dades?.origen === 'os-shell' && dades.tipus === 'idioma' && esIdiomaValid(dades.valor)) {
        this.establirIdioma(dades.valor);
      }
    });
  }

  private readonly dict: Record<IdiomaUi, Record<string, string>> = {
    ca: {
      // Configuració
      logo_alt: 'Logo del joc',
      titol_app: "L'Impostor",
      subtitol_app: 'Joc de deducció social',
      jugadors_titol: 'Jugadors',
      jugador_placeholder: 'Jugador {0}',
      eliminar_jugador: 'Eliminar jugador',
      afegir_jugador: '+ Afegir jugador',
      impostors_titol: 'Impostors',
      modalitat_titol: 'Modalitat',
      modus_lliure: 'Lliure',
      modus_categoria: 'Categoria',
      modus_ribes: 'Ribes',
      categoria_label: 'Categoria',
      categoria_placeholder: 'Ex: Animals, Pel·lícules, Esport...',
      dificultat_label: 'Dificultat: {0}/10',
      idioma_label: 'Idioma de les paraules',
      idioma_catala: 'Català',
      idioma_castella: 'Castellà',
      idioma_angles: 'Anglès',
      pista_label: "Pista per a l'impostor",
      pista_desc: "L'impostor veu la pista en lloc d'IMPOSTOR",
      ribes_info: 'Mode local amb paraules de Sant Pere de Ribes.',
      canviar_label: 'Permetre canviar paraula',
      canviar_desc: 'El primer jugador pot canviar la paraula si no li agrada',
      si: 'Sí',
      no: 'No',
      carregant_paraules: 'Carregant paraules...',
      comencar_joc: 'Començar Joc',
      falten_titol: 'Abans de començar, falta:',
      falta_nom_jugador: 'El nom del jugador {0}',
      falta_noms_jugadors: 'El nom dels jugadors {0}',
      falta_categoria: 'Indicar una categoria',
      falta_impostors: 'Un nombre vàlid d’impostors',
      error_ribes: "No s'ha pogut llegir ribes.json. Comprova que el fitxer existeix a public/assets/data/.",
      error_servidor: "No s'ha pogut connectar al servidor. Torna-ho a provar d'aquí a una estona.",

      // Repartiment
      repartiment_titol: 'Repartiment de Rols',
      repartiment_subtitol: 'Cada jugador ha de tocar el seu nom per veure el rol',
      toca_revelar: '👆 Toca per revelar',
      tots_llestos: 'Tots llestos! Iniciant el debat...',

      // Popup rol
      popup_privacitat: "Assegura't que ningú més mira la pantalla",
      popup_revelar: 'Prem per veure el teu rol',
      popup_la_teva_pista: 'La teva pista:',
      popup_la_teva_paraula: 'La teva paraula:',
      popup_hint_impostor: 'Intenta endevinar la paraula que saben els altres',
      popup_hint_pista: 'Usa la pista per intentar endevinar la paraula',
      popup_canviar: '↺ Canviar paraula',
      popup_restants: '{0} restants',
      popup_ultim: 'últim canvi',
      popup_entes: '✓ He entès el meu rol',

      // Debat
      debat_fase: 'FASE DE DEBAT',
      debat_titol: "Qui és l'Impostor?",
      debat_categoria: 'Categoria',
      debat_comenca: 'Comença la ronda',
      debat_comenca_hint: 'Ha de ser el primer en descriure la paraula',
      debat_jugadors: 'Jugadors en joc',
      debat_revelar: 'Revelar Impostor i Paraula',

      // Revelació
      revelacio_fase: 'REVELACIÓ FINAL',
      revelacio_titol: 'El Veredicte',
      revelacio_paraula: 'La paraula secreta era',
      revelacio_impostor: "L'Impostor",
      revelacio_impostors: 'Els Impostors',
      revelacio_seguidors: 'Seguidors de la Paraula',
      tornar_a_jugar: 'Tornar a Jugar',
    },
    es: {
      logo_alt: 'Logo del juego',
      titol_app: 'El Impostor',
      subtitol_app: 'Juego de deducción social',
      jugadors_titol: 'Jugadores',
      jugador_placeholder: 'Jugador {0}',
      eliminar_jugador: 'Eliminar jugador',
      afegir_jugador: '+ Añadir jugador',
      impostors_titol: 'Impostores',
      modalitat_titol: 'Modalidad',
      modus_lliure: 'Libre',
      modus_categoria: 'Categoría',
      modus_ribes: 'Ribes',
      categoria_label: 'Categoría',
      categoria_placeholder: 'Ej: Animales, Películas, Deporte...',
      dificultat_label: 'Dificultad: {0}/10',
      idioma_label: 'Idioma de las palabras',
      idioma_catala: 'Catalán',
      idioma_castella: 'Castellano',
      idioma_angles: 'Inglés',
      pista_label: 'Pista para el impostor',
      pista_desc: 'El impostor ve la pista en lugar de IMPOSTOR',
      ribes_info: 'Modo local con palabras de Sant Pere de Ribes.',
      canviar_label: 'Permitir cambiar palabra',
      canviar_desc: 'El primer jugador puede cambiar la palabra si no le gusta',
      si: 'Sí',
      no: 'No',
      carregant_paraules: 'Cargando palabras...',
      comencar_joc: 'Empezar Juego',
      falten_titol: 'Antes de empezar, falta:',
      falta_nom_jugador: 'El nombre del jugador {0}',
      falta_noms_jugadors: 'El nombre de los jugadores {0}',
      falta_categoria: 'Indicar una categoría',
      falta_impostors: 'Un número válido de impostores',
      error_ribes: 'No se ha podido leer ribes.json. Comprueba que el archivo existe en public/assets/data/.',
      error_servidor: 'No se ha podido conectar con el servidor. Vuelve a intentarlo dentro de un rato.',

      repartiment_titol: 'Reparto de Roles',
      repartiment_subtitol: 'Cada jugador debe tocar su nombre para ver su rol',
      toca_revelar: '👆 Toca para revelar',
      tots_llestos: '¡Todos listos! Iniciando el debate...',

      popup_privacitat: 'Asegúrate de que nadie más mira la pantalla',
      popup_revelar: 'Pulsa para ver tu rol',
      popup_la_teva_pista: 'Tu pista:',
      popup_la_teva_paraula: 'Tu palabra:',
      popup_hint_impostor: 'Intenta adivinar la palabra que saben los demás',
      popup_hint_pista: 'Usa la pista para intentar adivinar la palabra',
      popup_canviar: '↺ Cambiar palabra',
      popup_restants: '{0} restantes',
      popup_ultim: 'último cambio',
      popup_entes: '✓ He entendido mi rol',

      debat_fase: 'FASE DE DEBATE',
      debat_titol: '¿Quién es el Impostor?',
      debat_categoria: 'Categoría',
      debat_comenca: 'Empieza la ronda',
      debat_comenca_hint: 'Debe ser el primero en describir la palabra',
      debat_jugadors: 'Jugadores en juego',
      debat_revelar: 'Revelar Impostor y Palabra',

      revelacio_fase: 'REVELACIÓN FINAL',
      revelacio_titol: 'El Veredicto',
      revelacio_paraula: 'La palabra secreta era',
      revelacio_impostor: 'El Impostor',
      revelacio_impostors: 'Los Impostores',
      revelacio_seguidors: 'Seguidores de la Palabra',
      tornar_a_jugar: 'Volver a Jugar',
    },
    en: {
      logo_alt: 'Game logo',
      titol_app: 'The Impostor',
      subtitol_app: 'Social deduction game',
      jugadors_titol: 'Players',
      jugador_placeholder: 'Player {0}',
      eliminar_jugador: 'Remove player',
      afegir_jugador: '+ Add player',
      impostors_titol: 'Impostors',
      modalitat_titol: 'Mode',
      modus_lliure: 'Free',
      modus_categoria: 'Category',
      modus_ribes: 'Ribes',
      categoria_label: 'Category',
      categoria_placeholder: 'E.g. Animals, Movies, Sports...',
      dificultat_label: 'Difficulty: {0}/10',
      idioma_label: 'Word language',
      idioma_catala: 'Catalan',
      idioma_castella: 'Spanish',
      idioma_angles: 'English',
      pista_label: 'Hint for the impostor',
      pista_desc: 'The impostor sees the hint instead of IMPOSTOR',
      ribes_info: 'Local mode with words from Sant Pere de Ribes.',
      canviar_label: 'Allow changing the word',
      canviar_desc: "The first player can change the word if they don't like it",
      si: 'Yes',
      no: 'No',
      carregant_paraules: 'Loading words...',
      comencar_joc: 'Start Game',
      falten_titol: 'Before starting, you still need:',
      falta_nom_jugador: 'The name of player {0}',
      falta_noms_jugadors: 'The names of players {0}',
      falta_categoria: 'A category',
      falta_impostors: 'A valid number of impostors',
      error_ribes: "Couldn't read ribes.json. Check that the file exists in public/assets/data/.",
      error_servidor: "Couldn't connect to the server. Please try again in a while.",

      repartiment_titol: 'Role Assignment',
      repartiment_subtitol: 'Each player must tap their name to see their role',
      toca_revelar: '👆 Tap to reveal',
      tots_llestos: 'All set! Starting the debate...',

      popup_privacitat: 'Make sure nobody else is looking at the screen',
      popup_revelar: 'Press to see your role',
      popup_la_teva_pista: 'Your hint:',
      popup_la_teva_paraula: 'Your word:',
      popup_hint_impostor: 'Try to guess the word the others know',
      popup_hint_pista: 'Use the hint to try to guess the word',
      popup_canviar: '↺ Change word',
      popup_restants: '{0} left',
      popup_ultim: 'last change',
      popup_entes: '✓ I understand my role',

      debat_fase: 'DEBATE PHASE',
      debat_titol: 'Who is the Impostor?',
      debat_categoria: 'Category',
      debat_comenca: 'Round starts with',
      debat_comenca_hint: 'They must be the first to describe the word',
      debat_jugadors: 'Players in game',
      debat_revelar: 'Reveal Impostor and Word',

      revelacio_fase: 'FINAL REVEAL',
      revelacio_titol: 'The Verdict',
      revelacio_paraula: 'The secret word was',
      revelacio_impostor: 'The Impostor',
      revelacio_impostors: 'The Impostors',
      revelacio_seguidors: 'Followers of the Word',
      tornar_a_jugar: 'Play Again',
    },
  };

  establirIdioma(idioma: IdiomaUi): void {
    this.idioma.set(idioma);
    document.documentElement.lang = idioma;
  }

  /** `params` substitueix `{0}`, `{1}`... dins del text traduït. */
  t(clau: string, params?: readonly (string | number)[]): string {
    const text = this.dict[this.idioma()]?.[clau] ?? clau;
    if (!params) return text;
    return params.reduce<string>((acc, valor, index) => acc.replace(`{${index}}`, String(valor)), text);
  }
}
