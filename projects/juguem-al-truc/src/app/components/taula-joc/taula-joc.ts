import { Component, computed, effect, inject, signal } from '@angular/core';
import { CartaJugada, PUNTS_LIMIT_RETRUC, TipusSenyal } from '../../models/joc.model';
import { Equip, equipDeSeient } from '../../models/personatge.model';
import { JugadorPublic } from '../../models/sala.model';
import { nomEquip, PosicioTaula, posicioRelativa } from '../../services/seients.util';
import { SessioJugadorService } from '../../services/sessio-jugador.service';
import { TraduccioService } from '../../services/traduccio.service';
import { TrucSocketService } from '../../services/truc-socket.service';
import { BarraAccions } from './barra-accions/barra-accions';
import { Carta } from './carta/carta';
import { MaJugador } from './ma-jugador/ma-jugador';
import { Marcador } from './marcador/marcador';
import { OverlayMa11 } from './overlay-ma11/overlay-ma11';
import { OverlayTruc } from './overlay-truc/overlay-truc';
import { PoseJugador, SeientJugador } from './seient-jugador/seient-jugador';

const DURADA_POSE_TRUCO_MS = 2200;
const DURADA_POSE_SENYAL_MS = 1000;

/** Entrada de la taula: només amb el terra (fons estàtic, res més), després es revela tota la resta (CSS, `.tj-revelat`). */
const RETARD_NOMES_TERRA_MS = 500;
/** Ha de ser >= la transició CSS més llarga de `taula-joc.css` (el difuminat verd, `0.65s`) perquè `entradaCompletada` no arribi abans que s'acabi de veure. */
const DURADA_REVELACIO_MS = 700;

interface JugadorAlSeient {
  readonly jugador: JugadorPublic | null;
  readonly seient: number;
}

const LLOC_BUIT: JugadorAlSeient = { jugador: null, seient: -1 };
const POSICIONS: readonly PosicioTaula[] = ['baix', 'dalt', 'esquerra', 'dreta'];

@Component({
  selector: 'app-taula-joc',
  imports: [SeientJugador, MaJugador, Marcador, Carta, BarraAccions, OverlayTruc, OverlayMa11],
  templateUrl: './taula-joc.html',
  styleUrl: './taula-joc.css',
})
export class TaulaJoc {
  protected readonly ts = inject(TraduccioService);
  protected readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly vista = this.trucSocket.estatJoc;
  protected readonly sala = this.trucSocket.estatSala;
  protected readonly elMeuSeient = this.trucSocket.elMeuSeient;

  protected readonly cartaSeleccionada = signal<string | null>(null);

  /**
   * Entrada en dos temps: primer només el terra i després la resta (tot per
   * CSS). Fins que no s'acaba, no es mostra l'anell de torn.
   */
  protected readonly iniciarRevelacio = signal(false);
  protected readonly entradaCompletada = signal(false);

  /** Pose puntual (truco/senyal) per seient, reverteix sola a "normal" al cap d'uns segons. */
  private readonly posePerSeient = signal<Partial<Record<number, PoseJugador>>>({});
  private readonly temporitzadorsPose = new Map<number, ReturnType<typeof setTimeout>>();

  /**
   * Cartes del centre de la taula. No es llegeix `vista().cartesRondaActual`
   * directament perquè cap vista inclou la carta que tanca la ronda (el motor
   * la buida en la mateixa transició): les cartes s'afegeixen a l'instant des
   * de `trucSocket.cartesJugades()` i es netegen amb la vista següent, que el
   * servidor envia amb retard perquè es vegi l'última carta.
   */
  protected readonly cartesTaula = signal<readonly CartaJugada[]>([]);

  /** Entrades de `trucSocket.cartesJugades()` ja afegides a `cartesTaula`. */
  private cartesJugadesProcessades = 0;

  constructor() {
    setTimeout(() => {
      this.iniciarRevelacio.set(true);
      setTimeout(() => this.entradaCompletada.set(true), DURADA_REVELACIO_MS);
    }, RETARD_NOMES_TERRA_MS);

    effect(() => {
      const totes = this.trucSocket.cartesJugades();
      if (totes.length <= this.cartesJugadesProcessades) return;
      const noves = totes.slice(this.cartesJugadesProcessades);
      this.cartesJugadesProcessades = totes.length;
      this.cartesTaula.update((cartes) => [...cartes, ...noves]);
    });

    effect(() => {
      this.cartesTaula.set(this.vista()?.cartesRondaActual ?? []);
    });

    effect(() => {
      const esdeveniment = this.trucSocket.darrerEsdeveniment();
      if (esdeveniment?.tipus !== 'truc_cantat') return;
      const seientQueCanta = this.vista()?.torn;
      if (seientQueCanta !== null && seientQueCanta !== undefined) {
        this.mostrarPoseTemporal(seientQueCanta, 'truco', DURADA_POSE_TRUCO_MS);
      }
    });

    effect(() => {
      const senyal = this.trucSocket.darrerSenyal();
      if (senyal) this.mostrarPoseTemporal(senyal.seient, senyal.tipus, DURADA_POSE_SENYAL_MS);
    });
  }

  protected readonly elMeuEquip = computed<Equip | null>(() => {
    const seient = this.elMeuSeient();
    return seient === null ? null : equipDeSeient(seient);
  });

  /** Noms reals dels jugadors de cada equip (no sempre Pere/Paula i Marina/Andreu). */
  protected readonly nomsEquip = computed<Record<Equip, string>>(() => {
    const jugadors = this.sala()?.jugadors ?? [];
    return { A: nomEquip(jugadors, 'A'), B: nomEquip(jugadors, 'B') };
  });

  protected readonly esElMeuTorn = computed(() => {
    const seient = this.elMeuSeient();
    return seient !== null && this.vista()?.torn === seient;
  });

  protected readonly perPosicio = computed<Record<PosicioTaula, JugadorAlSeient>>(() => {
    const jo = this.elMeuSeient();
    const jugadors = this.sala()?.jugadors ?? [null, null, null, null];
    const resultat: Record<PosicioTaula, JugadorAlSeient> = {
      baix: LLOC_BUIT,
      dalt: LLOC_BUIT,
      esquerra: LLOC_BUIT,
      dreta: LLOC_BUIT,
    };
    if (jo === null) return resultat;
    for (let seient = 0; seient < 4; seient++) {
      resultat[posicioRelativa(seient, jo)] = { jugador: jugadors[seient], seient };
    }
    return resultat;
  });

  protected readonly posicions = POSICIONS;

  /** Posició relativa de qui ha jugat la carta: es dibuixa a la vora del seu gegant. */
  protected posicioCarta(seient: number): PosicioTaula {
    const jo = this.elMeuSeient();
    return jo === null ? 'baix' : posicioRelativa(seient, jo);
  }

  // --- Truc ---
  protected readonly potTrucar = computed(() => {
    const v = this.vista();
    if (!v || !this.esElMeuTorn() || v.aposta?.pendent || v.esMaDels11) return false;
    const algunEquipA10 = v.puntuacions.A >= PUNTS_LIMIT_RETRUC || v.puntuacions.B >= PUNTS_LIMIT_RETRUC;
    const valorMaxim = algunEquipA10 ? 2 : 3;
    return (v.aposta?.valor ?? 1) < valorMaxim && v.aposta?.equipUltimCantador !== this.elMeuEquip();
  });

  protected readonly trucPendent = computed(() => this.vista()?.aposta?.pendent === true);

  protected readonly valorTrucProposat = computed<2 | 3>(() => {
    const valor = this.vista()?.aposta?.valor ?? 1;
    return valor === 1 ? 2 : 3;
  });

  protected readonly potRespondreTruc = computed(() => {
    const v = this.vista();
    return v?.aposta?.pendent === true && v.aposta.equipUltimCantador !== this.elMeuEquip();
  });

  // --- Mà dels 11 ---
  protected readonly ma11Pendent = computed(() => this.vista()?.ma11Pendent ?? null);
  protected readonly potDecidirMa11 = computed(() => this.ma11Pendent() !== null && this.ma11Pendent() === this.elMeuEquip());

  // --- Senyals ---
  protected readonly potSenyalar = computed(() => (this.vista()?.maPropia?.length ?? 0) > 0);

  protected cartesRestantsPer(seient: number): number | null {
    return this.vista()?.cartesRestants?.[seient] ?? null;
  }

  protected posePer(seient: number): PoseJugador {
    return this.posePerSeient()[seient] ?? 'normal';
  }

  private mostrarPoseTemporal(seient: number, pose: PoseJugador, duradaMs: number): void {
    // Una pose nova substitueix l'anterior: el seu temporitzador ja no ha de revertir-la.
    clearTimeout(this.temporitzadorsPose.get(seient));
    this.posePerSeient.update((p) => ({ ...p, [seient]: pose }));
    this.temporitzadorsPose.set(
      seient,
      setTimeout(() => this.posePerSeient.update((p) => ({ ...p, [seient]: 'normal' })), duradaMs),
    );
  }

  protected jugarCartaSeleccionada(): void {
    const cartaId = this.cartaSeleccionada();
    if (!cartaId || !this.esElMeuTorn()) return;
    this.trucSocket.jugarCarta(cartaId);
    this.cartaSeleccionada.set(null);
  }

  protected cantarTruc(): void {
    this.trucSocket.cantarTruc();
  }

  protected respondreTruc(accepta: boolean): void {
    this.trucSocket.respondreTruc(accepta);
  }

  protected decidirMa11(vol: boolean): void {
    this.trucSocket.decidirMa11(vol);
  }

  protected ferSenyal(tipus: TipusSenyal): void {
    this.trucSocket.ferSenyal(tipus);
  }

  protected async abandonar(): Promise<void> {
    await this.trucSocket.abandonarPartida();
    this.sessio.abandonar();
  }
}
