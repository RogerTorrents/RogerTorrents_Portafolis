import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { CartaJugada, EsdevenimentJoc, TipusSenyal, VistaJugador } from '../models/joc.model';
import { Personatge } from '../models/personatge.model';
import { EstatSalaPublic, ModeSala, RespostaAbandonar, RespostaConsultaSala, RespostaSala } from '../models/sala.model';

export interface ErrorSala {
  readonly codi: string;
  readonly missatge: string;
}

export interface SenyalFet {
  readonly seient: number;
  readonly tipus: TipusSenyal;
}

/**
 * Embolcall de socket.io-client: manté un únic socket per sessió de joc i
 * exposa l'estat rebut del servidor com a signals. Cap component hi parla
 * directament amb `socket.io-client` — sempre a través d'aquest servei.
 */
@Injectable({ providedIn: 'root' })
export class TrucSocketService {
  private socket: Socket | null = null;

  readonly connectat = signal(false);
  readonly estatSala = signal<EstatSalaPublic | null>(null);
  readonly estatJoc = signal<VistaJugador | null>(null);
  readonly elMeuSeient = signal<number | null>(null);
  readonly darrerEsdeveniment = signal<EsdevenimentJoc | null>(null);
  /**
   * TOTES les cartes jugades (mai només la darrera): `carta_jugada` sovint
   * arriba acompanyat, en el mateix instant, de `ronda_resolta` (justament
   * quan es tanca una ronda — i de vegades també `ma_resolta`/
   * `ma_repartida` si la mà també s'acaba). Si només es guardés com
   * "l'últim esdeveniment" en un sol signal (com fa `darrerEsdeveniment`),
   * Angular pot encadenar els `.set()` consecutius abans que cap `effect`
   * arribi a reaccionar-hi — i com un `effect` només veu el valor MÉS
   * RECENT quan finalment s'executa, la carta es perd sense pintar-se mai
   * (bug real reportat: "la carta de tancar ronda desapareix"). Un array
   * que només CREIX mai perd cap entrada, encara que el consumidor
   * s'executi menys cops dels que aquest signal s'actualitza. Es buida en
   * començar una partida nova (`partida_iniciada`) perquè no hi quedin
   * cartes d'una partida anterior.
   */
  readonly cartesJugades = signal<readonly CartaJugada[]>([]);
  /** Comptador que puja cada cop que arriba `partida_iniciada` (el senyal per començar l'animació d'intro). */
  readonly senyalIniciPartida = signal(0);
  /** Comptador que puja cada cop que arriba `partida_reiniciada` (algú ha premut "tornar a jugar" des de la partida acabada). */
  readonly senyalReiniciarPartida = signal(0);
  readonly darrerSenyal = signal<SenyalFet | null>(null);
  readonly seientDesconnectat = signal<number | null>(null);
  readonly darrerError = signal<ErrorSala | null>(null);

  private connectar(): Socket {
    if (this.socket) return this.socket;

    const socket = io(environment.apiUrl, { transports: ['websocket'] });

    socket.on('connect', () => this.connectat.set(true));
    socket.on('disconnect', () => this.connectat.set(false));

    socket.on('estat_sala', (estat: EstatSalaPublic) => this.estatSala.set(estat));
    socket.on('partida_iniciada', () => {
      this.cartesJugades.set([]);
      this.senyalIniciPartida.update((v) => v + 1);
    });
    socket.on('carta_jugada', (esdeveniment: CartaJugada) => this.cartesJugades.update((cartes) => [...cartes, esdeveniment]));
    socket.on('partida_reiniciada', () => this.senyalReiniciarPartida.update((v) => v + 1));
    socket.on('estat_joc', (vista: VistaJugador) => {
      this.estatJoc.set(vista);
      this.elMeuSeient.set(vista.elMeuSeient);
    });
    socket.on('senyal_fet', (senyal: SenyalFet) => this.darrerSenyal.set(senyal));
    socket.on('jugador_desconnectat', (dades: { seient: number }) => this.seientDesconnectat.set(dades.seient));
    socket.on('error_sala', (error: ErrorSala) => this.darrerError.set(error));

    for (const tipus of [
      'ma_repartida',
      'ronda_resolta',
      'ma_resolta',
      'truc_cantat',
      'truc_resolt',
      'ma11_pendent',
      'ma11_resolta',
      'partida_acabada',
    ] as const) {
      socket.on(tipus, (esdeveniment: EsdevenimentJoc) => this.darrerEsdeveniment.set(esdeveniment));
    }

    this.socket = socket;
    return socket;
  }

  consultarSala(codiSala: string): Promise<RespostaConsultaSala> {
    return new Promise((resolve) => this.connectar().emit('consultar_sala', { codiSala }, resolve));
  }

  crearSala(nom: string, personatge: Personatge, mode: ModeSala = 'normal'): Promise<RespostaSala> {
    return new Promise((resolve) =>
      this.connectar().emit('crear_sala', { nom, personatge, mode }, this.recordarSeient(resolve)),
    );
  }

  unirSala(codiSala: string, nom: string, personatge: Personatge): Promise<RespostaSala> {
    return new Promise((resolve) =>
      this.connectar().emit('unir_sala', { codiSala, nom, personatge }, this.recordarSeient(resolve)),
    );
  }

  reconnectar(codiSala: string, jugadorToken: string): Promise<RespostaSala> {
    return new Promise((resolve) =>
      this.connectar().emit('reconnectar', { codiSala, jugadorToken }, this.recordarSeient(resolve)),
    );
  }

  /**
   * `elMeuSeient` també s'actualitza en rebre `estat_joc`, però això no
   * arriba fins que la partida comença — cal fixar-lo ja aquí perquè la
   * sala d'espera (abans de jugar) sàpiga qui ets tu.
   */
  private recordarSeient(resolve: (resposta: RespostaSala) => void): (resposta: RespostaSala) => void {
    return (resposta) => {
      if (resposta.ok) this.elMeuSeient.set(resposta.seient);
      resolve(resposta);
    };
  }

  iniciarPartida(): void {
    this.connectar().emit('iniciar_partida');
  }

  /** "Tornar a jugar" des de la partida acabada: torna la sala a l'espera (mateixos seients, mateix codi). */
  tornarAJugar(): void {
    this.connectar().emit('tornar_a_jugar');
  }

  jugarCarta(cartaId: string): void {
    this.connectar().emit('jugar_carta', { cartaId });
  }

  cantarTruc(): void {
    this.connectar().emit('cantar_truc');
  }

  respondreTruc(accepta: boolean): void {
    this.connectar().emit('respondre_truc', { accepta });
  }

  decidirMa11(vol: boolean): void {
    this.connectar().emit('decidir_ma11', { vol });
  }

  ferSenyal(tipus: TipusSenyal): void {
    this.connectar().emit('fer_senyal', { tipus });
  }

  /** Abandona la sala activa (allibera el seient, o el converteix en bot si la partida ja anava). */
  abandonarPartida(): Promise<RespostaAbandonar> {
    return new Promise((resolve) => this.connectar().emit('abandonar_partida', resolve));
  }
}
