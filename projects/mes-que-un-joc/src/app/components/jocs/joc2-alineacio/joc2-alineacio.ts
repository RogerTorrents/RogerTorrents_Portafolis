import { Component, effect, inject, signal } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { DadesService } from '../../../services/dades.service';
import { EpocaService } from '../../../services/epoca.service';
import { ProgresService } from '../../../services/progres.service';
import { NavegacioService } from '../../../services/navegacio.service';
import { MotorJocService } from '../../../services/motor-joc.service';
import { Temporada } from '../../../models/temporada.model';
import { Jugador } from '../../../models/jugador.model';
import { triarAleatori, triarNDiferents } from '../../../utils/aleatori.util';
import { agruparPerPosicio, FilaPosicio } from '../../../utils/posicio.util';
import { CapsaleraJoc } from '../../compartit/capsalera-joc/capsalera-joc';
import { ResultatJoc } from '../../compartit/resultat-joc/resultat-joc';
import { FotoJugador } from '../../compartit/foto-jugador/foto-jugador';

/** Nombre màxim d'opcions mostrades a cada ronda (1 correcta + fins a 9 distractors). */
const NOMBRE_OPCIONS = 10;

@Component({
  selector: 'app-joc2-alineacio',
  imports: [CapsaleraJoc, ResultatJoc, FotoJugador],
  providers: [MotorJocService],
  templateUrl: './joc2-alineacio.html',
  styleUrl: './joc2-alineacio.css',
})
export class Joc2Alineacio {
  readonly ts = inject(TraduccioService);
  private readonly dades = inject(DadesService);
  private readonly epocaService = inject(EpocaService);
  private readonly progresService = inject(ProgresService);
  private readonly nav = inject(NavegacioService);
  readonly motor = inject(MotorJocService);

  readonly temporada = signal<Temporada | null>(null);
  readonly opcions = signal<readonly string[]>([]);
  readonly seleccio = signal<string | null>(null);

  /** Ids de les temporades ja preguntades en aquesta partida, perquè no es repeteixin. */
  private readonly temporadesVistes = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.iniciarRonda();

    effect(() => {
      if (this.motor.estat() === 'guanyat') {
        this.progresService.registrarResultat(
          this.epocaService.epocaActual(),
          'joc2',
          this.motor.estrellesGuanyades()
        );
      }
    });
  }

  jugadorsAlineacio(): readonly Jugador[] {
    const t = this.temporada();
    if (!t) return [];
    return t.alineacio
      .map(jt => this.dades.jugadorPerId(jt.jugadorId))
      .filter((j): j is Jugador => j !== undefined);
  }

  /** Onze agrupat per fila tàctica: porter, defenses, migcampistes, davanters. */
  filesAlineacio(): readonly FilaPosicio[] {
    return agruparPerPosicio(this.jugadorsAlineacio());
  }

  esCorrecte(): boolean | null {
    const sel = this.seleccio();
    const t = this.temporada();
    if (sel === null || !t) return null;
    return sel === t.id;
  }

  private iniciarRonda(): void {
    const poolPreguntes = this.dades.temporades();
    const vistes = this.temporadesVistes();
    const candidats = poolPreguntes.filter(t => !vistes.has(t.id));
    const nova = triarAleatori(candidats.length > 0 ? candidats : poolPreguntes);

    // Els distractors surten NOMÉS de l'època activa (mai una temporada de
    // fora de l'època seleccionada), encara que això vulgui dir menys de
    // 10 opcions quan l'època filtrada té poques temporades.
    const nombreDistractors = Math.min(NOMBRE_OPCIONS - 1, poolPreguntes.length - 1);
    const distractors = triarNDiferents(poolPreguntes, nombreDistractors, nova);
    const totes = [nova, ...distractors].sort((a, b) => a.anyInici - b.anyInici).map(t => t.id);
    this.opcions.set(totes);
    this.temporada.set(nova);
    this.seleccio.set(null);
    this.temporadesVistes.update(v => new Set(v).add(nova.id));
  }

  respondre(opcio: string): void {
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
    this.temporadesVistes.set(new Set());
    this.iniciarRonda();
  }

  tornarMenu(): void {
    this.nav.anarA('menu');
  }
}
