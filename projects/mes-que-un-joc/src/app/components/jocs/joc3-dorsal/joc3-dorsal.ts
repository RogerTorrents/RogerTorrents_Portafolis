import { Component, effect, inject, signal } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { DadesService } from '../../../services/dades.service';
import { EpocaService } from '../../../services/epoca.service';
import { ProgresService } from '../../../services/progres.service';
import { NavegacioService } from '../../../services/navegacio.service';
import { MotorJocService } from '../../../services/motor-joc.service';
import { Temporada, JugadorTemporada } from '../../../models/temporada.model';
import { Jugador } from '../../../models/jugador.model';
import { triarAleatori, triarNDiferents } from '../../../utils/aleatori.util';
import { CapsaleraJoc } from '../../compartit/capsalera-joc/capsalera-joc';
import { ResultatJoc } from '../../compartit/resultat-joc/resultat-joc';
import { FotoJugador } from '../../compartit/foto-jugador/foto-jugador';

/** Nombre total d'opcions mostrades a cada ronda (1 correcta + 9 distractors). */
const NOMBRE_OPCIONS = 10;

/**
 * Abans de la temporada 1996-97 el Barça (com la resta de clubs) no tenia
 * dorsals fixos per jugador: el número es repartia segons la posició a
 * cada partit concret (1-11 per demarcació). Per això aquest joc només fa
 * servir temporades a partir d'aquest any: preguntar un "dorsal fix" d'una
 * temporada anterior no tindria una resposta real única.
 */
const PRIMER_ANY_AMB_DORSAL_FIX = 1996;

@Component({
  selector: 'app-joc3-dorsal',
  imports: [CapsaleraJoc, ResultatJoc, FotoJugador],
  providers: [MotorJocService],
  templateUrl: './joc3-dorsal.html',
  styleUrl: './joc3-dorsal.css',
})
export class Joc3Dorsal {
  readonly ts = inject(TraduccioService);
  private readonly dades = inject(DadesService);
  private readonly epocaService = inject(EpocaService);
  private readonly progresService = inject(ProgresService);
  private readonly nav = inject(NavegacioService);
  readonly motor = inject(MotorJocService);

  readonly temporada = signal<Temporada | null>(null);
  readonly jugador = signal<Jugador | null>(null);
  readonly dorsalCorrecte = signal(0);
  readonly opcions = signal<readonly number[]>([]);
  readonly seleccio = signal<number | null>(null);

  /** Ids dels jugadors ja preguntats en aquesta partida, perquè no es repeteixin. */
  private readonly jugadorsVistos = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.iniciarRonda();

    effect(() => {
      if (this.motor.estat() === 'guanyat') {
        this.progresService.registrarResultat(
          this.epocaService.epocaActual(),
          'joc3',
          this.motor.estrellesGuanyades()
        );
      }
    });
  }

  esCorrecte(): boolean | null {
    const sel = this.seleccio();
    return sel === null ? null : sel === this.dorsalCorrecte();
  }

  private iniciarRonda(): void {
    const pool = this.dades.temporades().filter(t => t.anyInici >= PRIMER_ANY_AMB_DORSAL_FIX);
    const vistos = this.jugadorsVistos();

    const candidats: { temporada: Temporada; entrada: JugadorTemporada }[] = [];
    for (const t of pool) {
      for (const entrada of t.alineacio) {
        if (!vistos.has(entrada.jugadorId)) candidats.push({ temporada: t, entrada });
      }
    }
    if (candidats.length === 0) {
      for (const t of pool) {
        for (const entrada of t.alineacio) candidats.push({ temporada: t, entrada });
      }
    }

    const { temporada: temporadaTriada, entrada } = triarAleatori(candidats);
    const jugadorTriat = this.dades.jugadorPerId(entrada.jugadorId);
    if (!jugadorTriat) return;

    const altresDorsals: JugadorTemporada[] = temporadaTriada.alineacio.filter(
      jt => jt.jugadorId !== entrada.jugadorId
    );
    const distractors = triarNDiferents(altresDorsals, NOMBRE_OPCIONS - 1).map(jt => jt.dorsal);
    const totes = [entrada.dorsal, ...distractors].sort((a, b) => a - b);

    this.temporada.set(temporadaTriada);
    this.jugador.set(jugadorTriat);
    this.dorsalCorrecte.set(entrada.dorsal);
    this.opcions.set(totes);
    this.seleccio.set(null);
    this.jugadorsVistos.update(v => new Set(v).add(entrada.jugadorId));
  }

  respondre(opcio: number): void {
    if (this.seleccio() !== null) return;
    this.seleccio.set(opcio);
  }

  seguent(): void {
    const encertat = this.esCorrecte();
    if (encertat === null) return;
    this.motor.registrarResposta(encertat);
    if (this.motor.estat() !== 'jugant') return;
    this.iniciarRonda();
  }

  reiniciar(): void {
    this.motor.reiniciar();
    this.jugadorsVistos.set(new Set());
    this.iniciarRonda();
  }

  tornarMenu(): void {
    this.nav.anarA('menu');
  }
}
