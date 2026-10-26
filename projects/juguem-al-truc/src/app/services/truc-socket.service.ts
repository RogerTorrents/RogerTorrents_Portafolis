import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { CartaJugada, EsdevenimentJoc, TipusSenyal, VistaJugador } from '../models/joc.model';
import { Personatge } from '../models/personatge.model';
import { EstatSalaPublic, ModeSala, RespostaAbandonar, RespostaConsultaSala, RespostaSala } from '../models/sala.model';
import { SessioJugadorService } from './sessio-jugador.service';
import { TraduccioService } from './traduccio.service';

export interface ErrorSala {
  readonly codi: string;
  readonly missatge: string;
}

export interface SenyalFet {
  readonly seient: number;
  readonly tipus: TipusSenyal;
}

/** Temps màxim d'espera de la resposta (ack) del servidor a una petició. */
const TEMPS_MAX_RESPOSTA_MS = 10_000;

/** Esdeveniments de joc que només interessen com a "últim que ha passat". */
const ESDEVENIMENTS_JOC = [
  'ma_repartida',
  'ronda_resolta',
  'ma_resolta',
  'truc_cantat',
  'truc_resolt',
  'ma11_pendent',
  'ma11_resolta',
  'partida_acabada',
] as const;

/**
 * Embolcall de socket.io-client: un únic socket per sessió de joc, amb
 * l'estat rebut del servidor exposat com a signals. Cap component parla
 * directament amb `socket.io-client`.
 */
@Injectable({ providedIn: 'root' })
export class TrucSocketService {
  private readonly sessio = inject(SessioJugadorService);
  private readonly ts = inject(TraduccioService);
  private socket: Socket | null = null;

  readonly connectat = signal(false);
  readonly estatSala = signal<EstatSalaPublic | null>(null);
  readonly estatJoc = signal<VistaJugador | null>(null);
  readonly elMeuSeient = signal<number | null>(null);
  readonly darrerEsdeveniment = signal<EsdevenimentJoc | null>(null);
  /**
   * Totes les cartes de la partida, no només la darrera: `carta_jugada`
   * sovint arriba en el mateix instant que `ronda_resolta`, i un `effect`
   * només veu l'últim valor d'un signal. Una llista que només creix no en
   * perd cap. Es buida a `partida_iniciada`.
   */
  readonly cartesJugades = signal<readonly CartaJugada[]>([]);
  /** Puja a cada `partida_iniciada` (dispara l'animació d'entrada). */
  readonly senyalIniciPartida = signal(0);
  /** Puja a cada `partida_reiniciada` ("tornar a jugar" des de la partida acabada). */
  readonly senyalReiniciarPartida = signal(0);
  readonly darrerSenyal = signal<SenyalFet | null>(null);
  readonly seientDesconnectat = signal<number | null>(null);
  readonly darrerError = signal<ErrorSala | null>(null);

  private connectar(): Socket {
    if (this.socket) return this.socket;

    const socket = io(environment.apiUrl, { transports: ['websocket'] });
    let primeraConnexio = true;

    socket.on('connect', () => {
      this.connectat.set(true);
      // Després d'una caiguda de xarxa, socket.io es reconnecta amb un socket
      // nou que el servidor no associa a cap jugador: cal tornar a la sala.
      if (!primeraConnexio) this.tornarALaSala(socket);
      primeraConnexio = false;
    });
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

    for (const tipus of ESDEVENIMENTS_JOC) {
      socket.on(tipus, (esdeveniment: EsdevenimentJoc) => this.darrerEsdeveniment.set(esdeveniment));
    }

    this.socket = socket;
    return socket;
  }

  private tornarALaSala(socket: Socket): void {
    const desada = this.sessio.recuperar();
    if (!desada) return;
    socket.emit('reconnectar', desada, this.recordarSeient(() => undefined));
  }

  /**
   * Envia una petició amb resposta. Si el servidor no respon a temps (connexió
   * perduda), resol amb un error en lloc de deixar la promesa penjada.
   */
  private peticio<T>(esdeveniment: string, dades?: object): Promise<T | { ok: false; codi: string; missatge: string }> {
    const socket = this.connectar().timeout(TEMPS_MAX_RESPOSTA_MS);
    return new Promise((resolve) => {
      const enResposta = (error: Error | null, resposta: T): void =>
        resolve(error ? { ok: false, codi: 'sense_resposta', missatge: this.ts.t('error_sense_resposta') } : resposta);
      if (dades === undefined) socket.emit(esdeveniment, enResposta);
      else socket.emit(esdeveniment, dades, enResposta);
    });
  }

  consultarSala(codiSala: string): Promise<RespostaConsultaSala> {
    return this.peticio<RespostaConsultaSala>('consultar_sala', { codiSala });
  }

  crearSala(nom: string, personatge: Personatge, mode: ModeSala = 'normal'): Promise<RespostaSala> {
    return this.peticio<RespostaSala>('crear_sala', { nom, personatge, mode }).then(this.recordarSeient((r) => r));
  }

  unirSala(codiSala: string, nom: string, personatge: Personatge): Promise<RespostaSala> {
    return this.peticio<RespostaSala>('unir_sala', { codiSala, nom, personatge }).then(this.recordarSeient((r) => r));
  }

  reconnectar(codiSala: string, jugadorToken: string): Promise<RespostaSala> {
    return this.peticio<RespostaSala>('reconnectar', { codiSala, jugadorToken }).then(this.recordarSeient((r) => r));
  }

  /**
   * `elMeuSeient` també arriba amb `estat_joc`, però no fins que comença la
   * partida: la sala d'espera ja necessita saber quin seient és el teu.
   */
  private recordarSeient<R>(seguent: (resposta: RespostaSala) => R): (resposta: RespostaSala) => R {
    return (resposta) => {
      if (resposta.ok) this.elMeuSeient.set(resposta.seient);
      return seguent(resposta);
    };
  }

  iniciarPartida(): void {
    this.connectar().emit('iniciar_partida');
  }

  /** "Tornar a jugar" des de la partida acabada: mateixa sala, mateixos seients. */
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

  /** Allibera el seient (o el passa a un bot si la partida ja anava). */
  abandonarPartida(): Promise<RespostaAbandonar> {
    return this.peticio<RespostaAbandonar>('abandonar_partida');
  }
}
