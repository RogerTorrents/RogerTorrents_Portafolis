import { Component, effect, inject, signal } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { DadesService } from '../../../services/dades.service';
import { EpocaService } from '../../../services/epoca.service';
import { ProgresService } from '../../../services/progres.service';
import { NavegacioService } from '../../../services/navegacio.service';
import { MotorJocService } from '../../../services/motor-joc.service';
import { Temporada } from '../../../models/temporada.model';
import { Jugador } from '../../../models/jugador.model';
import { TOTS_ELS_TITOLS, TitolId } from '../../../models/titol.model';
import { triarAleatori } from '../../../utils/aleatori.util';
import { agruparPerPosicio, FilaPosicio } from '../../../utils/posicio.util';
import { CapsaleraJoc } from '../../compartit/capsalera-joc/capsalera-joc';
import { ResultatJoc } from '../../compartit/resultat-joc/resultat-joc';
import { FotoJugador } from '../../compartit/foto-jugador/foto-jugador';
import { IconaTitol } from '../../compartit/icona-titol/icona-titol';

@Component({
  selector: 'app-joc4-titols',
  imports: [CapsaleraJoc, ResultatJoc, FotoJugador, IconaTitol],
  providers: [MotorJocService],
  templateUrl: './joc4-titols.html',
  styleUrl: './joc4-titols.css',
})
export class Joc4Titols {
  readonly ts = inject(TraduccioService);
  private readonly dades = inject(DadesService);
  private readonly epocaService = inject(EpocaService);
  private readonly progresService = inject(ProgresService);
  private readonly nav = inject(NavegacioService);
  readonly motor = inject(MotorJocService);

  readonly totsElsTitols = TOTS_ELS_TITOLS;

  readonly temporada = signal<Temporada | null>(null);
  readonly seleccionats = signal<ReadonlySet<TitolId>>(new Set());
  readonly confirmat = signal(false);

  /** Ids de les temporades ja preguntades en aquesta partida, perquè no es repeteixin. */
  private readonly temporadesVistes = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.iniciarRonda();

    effect(() => {
      if (this.motor.estat() === 'guanyat') {
        this.progresService.registrarResultat(
          this.epocaService.epocaActual(),
          'joc4',
          this.motor.estrellesGuanyades()
        );
      }
    });
  }

  jugadorsPlantilla(): readonly Jugador[] {
    const t = this.temporada();
    if (!t) return [];
    return t.alineacio
      .map(jt => this.dades.jugadorPerId(jt.jugadorId))
      .filter((j): j is Jugador => j !== undefined);
  }

  /** Plantilla agrupada per fila tàctica: porter, defenses, migcampistes, davanters. */
  filesPlantilla(): readonly FilaPosicio[] {
    return agruparPerPosicio(this.jugadorsPlantilla());
  }

  esCorrecte(): boolean {
    const t = this.temporada();
    if (!t) return false;
    const esperats = new Set(t.titols);
    const triats = this.seleccionats();
    if (esperats.size !== triats.size) return false;
    for (const titol of esperats) {
      if (!triats.has(titol)) return false;
    }
    return true;
  }

  estaGuanyat(titol: TitolId): boolean {
    return (this.temporada()?.titols ?? []).includes(titol);
  }

  private iniciarRonda(): void {
    const pool = this.dades.temporades();
    const vistes = this.temporadesVistes();
    const candidats = pool.filter(t => !vistes.has(t.id));
    const nova = triarAleatori(candidats.length > 0 ? candidats : pool);
    this.temporada.set(nova);
    this.seleccionats.set(new Set());
    this.confirmat.set(false);
    this.temporadesVistes.update(v => new Set(v).add(nova.id));
  }

  alternar(titol: TitolId): void {
    if (this.confirmat()) return;
    this.seleccionats.update(actual => {
      const nou = new Set(actual);
      if (nou.has(titol)) {
        nou.delete(titol);
      } else {
        nou.add(titol);
      }
      return nou;
    });
  }

  confirmar(): void {
    if (this.confirmat()) return;
    this.confirmat.set(true);
  }

  seguent(): void {
    if (!this.confirmat()) return;
    this.motor.registrarResposta(this.esCorrecte());
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
