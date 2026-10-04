import { Injectable, signal } from '@angular/core';

export type Idioma = 'ca' | 'es' | 'en';

function esIdiomaValid(valor: unknown): valor is Idioma {
  return valor === 'ca' || valor === 'es' || valor === 'en';
}

const TEXTOS: Record<Idioma, Record<string, string>> = {
  ca: {
    // Transició d'entrada a la partida
    transicio_scroll_pista: "Desplaça't cap avall per entrar a la partida",

    // Menú inicial
    titol_joc: 'Juguem al Truc',
    subtitol_joc: 'El joc de cartes de Ribes',
    menu_crear: 'Crear partida',
    menu_unir: "Unir-se a partida",
    menu_com_jugar: 'Com es juga',

    // Mode de partida (només en crear)
    tria_mode: 'Tria el mode de joc',
    mode_normal: '4 jugadors',
    mode_normal_desc: 'Tots humans, cadascú des del seu dispositiu.',
    mode_solo: 'Sol vs IA',
    mode_solo_desc: 'Tu sol contra 3 jugadors controlats per la IA.',
    mode_parelles: 'Parelles vs IA',
    mode_parelles_desc: "Tu i un company humà contra una parella d'IA.",
    etiqueta_bot: 'IA',

    // Formulari comú (crear/unir)
    camp_nom: 'El teu nom',
    camp_nom_placeholder: 'Com et diuen?',
    camp_codi: 'Codi de la partida',
    camp_codi_placeholder: 'Ex: 7K2QP',
    tria_personatge: 'Tria el teu personatge',
    personatge_ocupat: 'Ja triat',
    boto_crear: 'Crear partida',
    boto_unir: "Unir-se",
    boto_tornar: 'Tornar',
    boto_abandonar: 'Abandonar partida',
    error_falta_nom: 'Escriu el teu nom.',
    error_falta_personatge: 'Tria un personatge.',
    error_falta_codi: 'Escriu el codi de la partida.',

    // Sala d'espera
    sala_titol: "Sala d'espera",
    sala_codi_label: 'Codi per convidar',
    sala_copiat: 'Copiat!',
    sala_esperant: 'Esperant la resta de jugadors…',
    sala_esperant_curt: 'Buit',
    sala_boto_iniciar: 'Iniciar partida',
    sala_nomes_host: "Només qui ha creat la partida pot iniciar-la.",

    // Personatges
    personatge_pere: 'Pere',
    personatge_marina: 'Marina',
    personatge_paula: 'Paula',
    personatge_andreu: 'Andreu',

    // Taula de joc
    la_teva_ma: 'La teva mà',
    tirar_carta: 'Tirar la carta',
    cantar_truc: 'Cantar Truc',
    senyal_un1: 'Tinc un 1',
    senyal_un2: 'Tinc un 2',
    senyal_un3: 'Tinc un 3',
    senyal_res: 'No porto res',

    // Overlay de Truc
    truc_cantat_titol: 'Han cantat',
    truc_valor_prefix: 'Truc a',
    truc_pregunta: 'Vols acceptar la pujada?',
    truc_esperant: "Esperant la resposta de l'altra parella…",
    vull: 'Vull!',
    no_vull: 'No vull',

    // Overlay de la mà dels 11
    ma11_titol: 'Sou a 11 punts',
    ma11_subtitol: 'La mà dels 11',
    ma11_pregunta: 'Voleu jugar aquesta mà?',
    ma11_esperant: "Esperant la decisió de l'altra parella…",
    vull_jugar: 'Vull jugar',
    no_vull_jugar: 'No vull jugar',

    // Partida acabada
    partida_acabada_titol: 'Guanya',
    partida_acabada_subtitol: 'Primera parella a arribar a 12 punts',
    tornar_a_jugar: 'Tornar a jugar',
    tornar_al_menu: 'Tornar al menú',

    // Com es juga
    cj_titol: 'Com es juga',
    cj_objectiu_titol: 'Objectiu',
    cj_objectiu_text: 'Guanya la primera parella que arribi a 12 punts.',
    cj_equips_titol: 'Equips i seients',
    cj_equips_text:
      'Sou 4 jugadors en 2 parelles. Cada jugador seu oposat al seu company: els dos seients del costat són els rivals.',
    cj_equip_a: 'Equip A',
    cj_equip_b: 'Equip B',
    cj_baralla_titol: 'La baralla',
    cj_baralla_text:
      "48 cartes (oros, copes, espases i bastos, de l'1 al 12). Entre colls no hi ha cap jerarquia: només compta el valor. De més forta a més fluixa:",
    cj_ma_titol: 'Com es juga una mà',
    cj_ma_text:
      "A cada mà, cadascú rep 3 cartes. Es juga per torns fins a 3 rondes: a cada ronda, tothom tira una carta i la més forta de la taula guanya la ronda per al seu equip. Si la carta més forta la comparteixen jugadors d'equips diferents, la ronda queda empatada i no la guanya ningú.",
    cj_ronda: 'Ronda',
    cj_guanyar_ma_titol: 'Qui guanya la mà',
    cj_guanyar_ma_text:
      "Guanya la mà l'equip que s'emporti 2 rondes de 3. Aquests són els casos possibles:",
    cj_cas_2a0: 'Guanyes les 2 primeres rondes.',
    cj_cas_1a_empat: 'Guanyes la 1a ronda i la 2a empata: la 1a decideix.',
    cj_cas_empat_2a: 'La 1a ronda empata i guanyes la 2a: guanyes la mà.',
    cj_cas_doble_empat: 'Les 2 primeres rondes empaten: la 3a ho decideix tot.',
    cj_cas_triple_empat: 'Les 3 rondes empaten: es reparteix de nou, sense punts.',
    cj_dot_guanyada: 'Guanyada',
    cj_dot_empat: 'Empat',
    cj_dot_decisiva: 'Decideix',
    cj_dot_na: 'No cal',
    cj_truc_titol: 'El Truc',
    cj_truc_text:
      'Cada mà val 1 punt d\'entrada. Durant el teu torn pots cantar "Truc" per pujar l\'aposta (1→2, i després 2→3). Només pot respondre l\'altra parella: "Vull!" accepta la pujada, o "No vull" la rebutja i doneu la mà per perduda a l\'instant — però només pel valor que tenia ABANS de la pujada proposada.',
    cj_ma11_titol: 'La mà dels 11',
    cj_ma11_text:
      "Quan una sola parella arriba a exactament 11 punts, abans de tirar cap carta ha de decidir si vol jugar aquesta mà (ja val 2 punts d'entrada) o no — pot mirar les seves pròpies cartes per decidir. Si diu que no, l'altra parella guanya 1 punt sense jugar-se res.",
    cj_senyals_titol: 'Els senyals',
    cj_senyals_text:
      'En qualsevol moment pots avisar el teu company amb un gest: "Tinc un 1/2/3" o "No porto res". Són purament informatius — no canvien el joc, només ajuden a entendre\'s amb la parella.',
    cj_partida_titol: 'Per guanyar la partida',
    cj_partida_text:
      'Les mans es van succeint (el repartidor rota cada cop) fins que una parella arriba a 12 punts. Aquesta guanya la partida.',

    // Genèric
    tu: 'tu',
    connectant: 'Connectant…',
    error_connexio: "No s'ha pogut connectar amb el servidor.",
  },
  es: {
    // Transición de entrada a la partida
    transicio_scroll_pista: 'Desplázate hacia abajo para entrar en la partida',

    // Menú inicial
    titol_joc: 'Juguem al Truc',
    subtitol_joc: 'El juego de cartas de Ribes',
    menu_crear: 'Crear partida',
    menu_unir: 'Unirse a partida',
    menu_com_jugar: 'Cómo se juega',

    // Modo de partida (solo al crear)
    tria_mode: 'Elige el modo de juego',
    mode_normal: '4 jugadores',
    mode_normal_desc: 'Todos humanos, cada uno desde su dispositivo.',
    mode_solo: 'Solo vs IA',
    mode_solo_desc: 'Tú solo contra 3 jugadores controlados por la IA.',
    mode_parelles: 'Parejas vs IA',
    mode_parelles_desc: 'Tú y un compañero humano contra una pareja de IA.',
    etiqueta_bot: 'IA',

    // Formulario común (crear/unir)
    camp_nom: 'Tu nombre',
    camp_nom_placeholder: '¿Cómo te llamas?',
    camp_codi: 'Código de la partida',
    camp_codi_placeholder: 'Ej: 7K2QP',
    tria_personatge: 'Elige tu personaje',
    personatge_ocupat: 'Ya elegido',
    boto_crear: 'Crear partida',
    boto_unir: 'Unirse',
    boto_tornar: 'Volver',
    boto_abandonar: 'Abandonar partida',
    error_falta_nom: 'Escribe tu nombre.',
    error_falta_personatge: 'Elige un personaje.',
    error_falta_codi: 'Escribe el código de la partida.',

    // Sala de espera
    sala_titol: 'Sala de espera',
    sala_codi_label: 'Código para invitar',
    sala_copiat: '¡Copiado!',
    sala_esperant: 'Esperando al resto de jugadores…',
    sala_esperant_curt: 'Vacío',
    sala_boto_iniciar: 'Iniciar partida',
    sala_nomes_host: 'Solo quien ha creado la partida puede iniciarla.',

    // Personajes
    personatge_pere: 'Pere',
    personatge_marina: 'Marina',
    personatge_paula: 'Paula',
    personatge_andreu: 'Andreu',

    // Mesa de juego
    la_teva_ma: 'Tu mano',
    tirar_carta: 'Tirar la carta',
    cantar_truc: 'Cantar Truc',
    senyal_un1: 'Tengo un 1',
    senyal_un2: 'Tengo un 2',
    senyal_un3: 'Tengo un 3',
    senyal_res: 'No llevo nada',

    // Overlay de Truc
    truc_cantat_titol: 'Han cantado',
    truc_valor_prefix: 'Truc a',
    truc_pregunta: '¿Quieres aceptar la subida?',
    truc_esperant: 'Esperando la respuesta de la otra pareja…',
    vull: '¡Quiero!',
    no_vull: 'No quiero',

    // Overlay de la mano de los 11
    ma11_titol: 'Estáis a 11 puntos',
    ma11_subtitol: 'La mano de los 11',
    ma11_pregunta: '¿Queréis jugar esta mano?',
    ma11_esperant: 'Esperando la decisión de la otra pareja…',
    vull_jugar: 'Quiero jugar',
    no_vull_jugar: 'No quiero jugar',

    // Partida acabada
    partida_acabada_titol: 'Gana',
    partida_acabada_subtitol: 'Primera pareja en llegar a 12 puntos',
    tornar_a_jugar: 'Volver a jugar',
    tornar_al_menu: 'Volver al menú',

    // Cómo se juega
    cj_titol: 'Cómo se juega',
    cj_objectiu_titol: 'Objetivo',
    cj_objectiu_text: 'Gana la primera pareja que llegue a 12 puntos.',
    cj_equips_titol: 'Equipos y asientos',
    cj_equips_text:
      'Sois 4 jugadores en 2 parejas. Cada jugador se sienta frente a su compañero: los dos asientos del lado son los rivales.',
    cj_equip_a: 'Equipo A',
    cj_equip_b: 'Equipo B',
    cj_baralla_titol: 'La baraja',
    cj_baralla_text:
      'La baraja tiene 48 cartas (oros, copas, espadas y bastos, del 1 al 12). Entre palos no hay ninguna jerarquía: solo cuenta el valor. De más fuerte a más floja:',
    cj_ma_titol: 'Cómo se juega una mano',
    cj_ma_text:
      'En cada mano, cada uno recibe 3 cartas. Se juega por turnos hasta 3 rondas: en cada ronda, todos tiran una carta y la más fuerte de la mesa gana la ronda para su equipo. Si la carta más fuerte la comparten jugadores de equipos distintos, la ronda queda empatada y no la gana nadie.',
    cj_ronda: 'Ronda',
    cj_guanyar_ma_titol: 'Quién gana la mano',
    cj_guanyar_ma_text:
      'Gana la mano el equipo que se lleve 2 de las 3 rondas. Estos son los casos posibles:',
    cj_cas_2a0: 'Ganas las 2 primeras rondas.',
    cj_cas_1a_empat: 'Ganas la 1ª ronda y la 2ª empata: la 1ª decide.',
    cj_cas_empat_2a: 'La 1ª ronda empata y ganas la 2ª: ganas la mano.',
    cj_cas_doble_empat: 'Las 2 primeras rondas empatan: la 3ª lo decide todo.',
    cj_cas_triple_empat: 'Las 3 rondas empatan: se reparte de nuevo, sin puntos.',
    cj_dot_guanyada: 'Ganada',
    cj_dot_empat: 'Empate',
    cj_dot_decisiva: 'Decide',
    cj_dot_na: 'No hace falta',
    cj_truc_titol: 'El Truc',
    cj_truc_text:
      'Cada mano vale 1 punto de entrada. Durante tu turno puedes cantar "Truc" para subir la apuesta (1→2, y luego 2→3). Solo puede responder la otra pareja: "¡Quiero!" acepta la subida, o "No quiero" la rechaza y dais la mano por perdida al instante — pero solo por el valor que tenía ANTES de la subida propuesta.',
    cj_ma11_titol: 'La mano de los 11',
    cj_ma11_text:
      'Cuando una sola pareja llega a exactamente 11 puntos, antes de tirar ninguna carta debe decidir si quiere jugar esta mano (ya vale 2 puntos de entrada) o no — puede mirar sus propias cartas para decidir. Si dice que no, la otra pareja gana 1 punto sin jugarse nada.',
    cj_senyals_titol: 'Las señales',
    cj_senyals_text:
      'En cualquier momento puedes avisar a tu compañero con un gesto: "Tengo un 1/2/3" o "No llevo nada". Son puramente informativas — no cambian el juego, solo ayudan a entenderse con la pareja.',
    cj_partida_titol: 'Para ganar la partida',
    cj_partida_text:
      'Las manos se van sucediendo (el repartidor rota cada vez) hasta que una pareja llega a 12 puntos. Esa gana la partida.',

    // Genérico
    tu: 'tú',
    connectant: 'Conectando…',
    error_connexio: 'No se ha podido conectar con el servidor.',
  },
  en: {
    // Game-entry transition
    transicio_scroll_pista: 'Scroll down to enter the game',

    // Main menu
    titol_joc: 'Juguem al Truc',
    subtitol_joc: 'The card game from Ribes',
    menu_crear: 'Create game',
    menu_unir: 'Join game',
    menu_com_jugar: 'How to play',

    // Game mode (create only)
    tria_mode: 'Choose the game mode',
    mode_normal: '4 players',
    mode_normal_desc: 'All human, each from their own device.',
    mode_solo: 'Solo vs AI',
    mode_solo_desc: 'You alone against 3 AI-controlled players.',
    mode_parelles: 'Pairs vs AI',
    mode_parelles_desc: 'You and a human teammate against a pair of AI.',
    etiqueta_bot: 'AI',

    // Shared form (create/join)
    camp_nom: 'Your name',
    camp_nom_placeholder: "What's your name?",
    camp_codi: 'Game code',
    camp_codi_placeholder: 'E.g.: 7K2QP',
    tria_personatge: 'Choose your character',
    personatge_ocupat: 'Already taken',
    boto_crear: 'Create game',
    boto_unir: 'Join',
    boto_tornar: 'Back',
    boto_abandonar: 'Abandon game',
    error_falta_nom: 'Enter your name.',
    error_falta_personatge: 'Choose a character.',
    error_falta_codi: 'Enter the game code.',

    // Waiting room
    sala_titol: 'Waiting room',
    sala_codi_label: 'Code to invite',
    sala_copiat: 'Copied!',
    sala_esperant: 'Waiting for the other players…',
    sala_esperant_curt: 'Empty',
    sala_boto_iniciar: 'Start game',
    sala_nomes_host: 'Only whoever created the game can start it.',

    // Characters
    personatge_pere: 'Pere',
    personatge_marina: 'Marina',
    personatge_paula: 'Paula',
    personatge_andreu: 'Andreu',

    // Game table
    la_teva_ma: 'Your hand',
    tirar_carta: 'Play the card',
    cantar_truc: 'Call Truc',
    senyal_un1: 'I have a 1',
    senyal_un2: 'I have a 2',
    senyal_un3: 'I have a 3',
    senyal_res: "I've got nothing",

    // Truc overlay
    truc_cantat_titol: 'Truc called',
    truc_valor_prefix: 'Truc to',
    truc_pregunta: 'Do you want to accept the raise?',
    truc_esperant: "Waiting for the other pair's answer…",
    vull: 'Accept!',
    no_vull: "Don't accept",

    // "Hand of 11" overlay
    ma11_titol: "You're at 11 points",
    ma11_subtitol: 'The hand of 11',
    ma11_pregunta: 'Do you want to play this hand?',
    ma11_esperant: "Waiting for the other pair's decision…",
    vull_jugar: 'Play it',
    no_vull_jugar: "Don't play it",

    // Game over
    partida_acabada_titol: 'Wins',
    partida_acabada_subtitol: 'First pair to reach 12 points',
    tornar_a_jugar: 'Play again',
    tornar_al_menu: 'Back to menu',

    // How to play
    cj_titol: 'How to play',
    cj_objectiu_titol: 'Objective',
    cj_objectiu_text: 'The first team to reach 12 points wins.',
    cj_equips_titol: 'Teams and seats',
    cj_equips_text: 'You are 4 players in 2 teams. Each player sits across from their teammate: the two side seats are the opponents.',
    cj_equip_a: 'Team A',
    cj_equip_b: 'Team B',
    cj_baralla_titol: 'The deck',
    cj_baralla_text:
      'The deck has 48 cards (coins, cups, swords and clubs, 1 to 12). Suits have no hierarchy between them: only the value counts. From strongest to weakest:',
    cj_ma_titol: 'How a hand is played',
    cj_ma_text:
      'Each hand deals 3 cards to everyone. Play goes in turns for up to 3 rounds: on each round, everyone plays one card, and the strongest card on the table wins the round for its team. If the strongest card is shared by players from different teams, the round is tied and nobody wins it.',
    cj_ronda: 'Round',
    cj_guanyar_ma_titol: 'Who wins the hand',
    cj_guanyar_ma_text:
      'The team that wins 2 of the 3 rounds wins the hand. Here are the possible cases:',
    cj_cas_2a0: 'You win the first 2 rounds.',
    cj_cas_1a_empat: 'You win round 1 and round 2 ties: round 1 decides.',
    cj_cas_empat_2a: 'Round 1 ties and you win round 2: you win the hand.',
    cj_cas_doble_empat: 'The first 2 rounds tie: round 3 decides everything.',
    cj_cas_triple_empat: 'All 3 rounds tie: the hand is redealt, no points.',
    cj_dot_guanyada: 'Won',
    cj_dot_empat: 'Tie',
    cj_dot_decisiva: 'Decides',
    cj_dot_na: 'Not needed',
    cj_truc_titol: 'Truc',
    cj_truc_text:
      'Each hand starts worth 1 point. On your turn you can call "Truc" to raise the stake (1→2, then 2→3). Only the other team can respond: "Accept!" takes the raise, or "Don\'t accept" declines it and you concede the hand immediately — but only for the value it had BEFORE the proposed raise.',
    cj_ma11_titol: 'The hand of 11',
    cj_ma11_text:
      'When exactly one team reaches 11 points, before playing any card they must decide whether to play this hand (already worth 2 points) or not — they can look at their own cards to decide. If they decline, the other team wins 1 point without playing anything.',
    cj_senyals_titol: 'Signals',
    cj_senyals_text:
      'At any time you can signal your teammate with a gesture: "I have a 1/2/3" or "I have nothing". These are purely informational — they don\'t change the game, they just help you communicate with your partner.',
    cj_partida_titol: 'Winning the game',
    cj_partida_text: 'Hands keep being dealt (the dealer rotates each time) until one team reaches 12 points. That team wins the game.',

    // Generic
    tu: 'you',
    connectant: 'Connecting…',
    error_connexio: 'Could not connect to the server.',
  },
};

/**
 * L'idioma el controla el selector de la barra de tasques del Shell
 * (postMessage, veure constructor) — l'app no té cap selector propi. El
 * default 'ca' només s'aplica si l'app s'obre sola (fora de l'iframe del
 * Shell).
 */
@Injectable({ providedIn: 'root' })
export class TraduccioService {
  readonly idioma = signal<Idioma>('ca');

  constructor() {
    window.addEventListener('message', (ev: MessageEvent) => {
      const dades = ev.data as { origen?: unknown; tipus?: unknown; valor?: unknown } | null;
      if (dades?.origen === 'os-shell' && dades.tipus === 'idioma' && esIdiomaValid(dades.valor)) {
        this.idioma.set(dades.valor);
      }
    });
  }

  t(clau: string): string {
    return TEXTOS[this.idioma()][clau] ?? TEXTOS.ca[clau] ?? clau;
  }
}
