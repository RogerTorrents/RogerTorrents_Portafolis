import { Component, computed, effect, inject, signal } from '@angular/core';
import { CartaJugada, TipusSenyal } from '../../models/joc.model';
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
   * Entrada de la taula en 2 temps: primer només es veu el terra (el fons
   * estàtic ja hi és, cap element de joc encara), i al cap d'un segon es
   * revela la resta (gegants des de dalt, mà pròpia des de la dreta,
   * difuminat verd a poc a poc — tot per CSS, només calen aquests 2
   * senyals). Mentre no s'ha acabat de revelar, cap "moviment" de jugador
   * (l'anell pulsant de torn) es mostra — es gestiona al template.
   */
  protected readonly iniciarRevelacio = signal(false);
  protected readonly entradaCompletada = signal(false);

  /** Pose puntual (truco/senyal) per seient, reverteix sola a "normal" al cap d'uns segons. */
  private readonly posePerSeient = signal<Partial<Record<number, PoseJugador>>>({});

  /**
   * Cartes visibles al centre de la taula. El servidor retarda l'`estat_joc`
   * que buida `cartesRondaActual` uns segons després de resoldre la ronda
   * (perquè es vegi l'última carta abans de netejar la taula) — si aquí
   * s'hagués llegit `vista().cartesRondaActual` directament, la carta del
   * jugador que tanca la ronda no arribaria mai a mostrar-se (l'estat que
   * la inclou dins la ronda plena mai es difon: el motor ja la buida en la
   * mateixa transició). Per això aquesta carta es pinta a l'instant a partir
   * de la cua `trucSocket.cartesJugades()` (vegeu el seu comentari — mai
   * es perd cap carta, ni tan sols la que tanca la ronda), i només es
   * neteja quan arriba la següent vista (que el servidor ja envia amb el
   * retard oportú) — cap temporitzador propi al frontend.
   */
  protected readonly cartesTaula = signal<readonly CartaJugada[]>([]);

  /** Quantes entrades de `trucSocket.cartesJugades()` ja s'han afegit a `cartesTaula` — mai es reprocessen, només les noves des de l'últim cop. */
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

  /**
   * Posició (relativa a un mateix) de qui ha jugat una carta — cada carta
   * es dibuixa a la vora del seu propi gegant perquè s'identifiqui qui
   * l'ha tirada; l'ordre de capes (qui queda per sobre de qui) ve sol de
   * l'ordre del `@for` sobre `cartesTaula()`, que ja és l'ordre real de
   * joc — no cal cap lògica extra per a això.
   */
  protected posicioCarta(seient: number): PosicioTaula {
    const jo = this.elMeuSeient();
    return jo === null ? 'baix' : posicioRelativa(seient, jo);
  }

  // --- Truc ---
  protected readonly potTrucar = computed(() => {
    const v = this.vista();
    if (!v || !this.esElMeuTorn() || v.aposta?.pendent || v.esMaDels11) return false;
    return (v.aposta?.valor ?? 1) < 3 && v.aposta?.equipUltimCantador !== this.elMeuEquip();
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
    this.posePerSeient.update((p) => ({ ...p, [seient]: pose }));
    setTimeout(() => {
      this.posePerSeient.update((p) => ({ ...p, [seient]: 'normal' }));
    }, duradaMs);
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
