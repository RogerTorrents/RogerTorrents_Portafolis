import { Component, effect, inject, signal } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { DadesService } from '../../../services/dades.service';
import { EpocaService } from '../../../services/epoca.service';
import { ProgresService } from '../../../services/progres.service';
import { NavegacioService } from '../../../services/navegacio.service';
import { MotorJocService } from '../../../services/motor-joc.service';
import { Jugador } from '../../../models/jugador.model';
import { triarAleatori, triarNDiferents } from '../../../utils/aleatori.util';
import { CapsaleraJoc } from '../../compartit/capsalera-joc/capsalera-joc';
import { ResultatJoc } from '../../compartit/resultat-joc/resultat-joc';
import { FotoJugador } from '../../compartit/foto-jugador/foto-jugador';

type Costat = 'esquerra' | 'dreta';

@Component({
  selector: 'app-joc1-minuts',
  imports: [CapsaleraJoc, ResultatJoc, FotoJugador],
  providers: [MotorJocService],
  templateUrl: './joc1-minuts.html',
  styleUrl: './joc1-minuts.css',
})
export class Joc1Minuts {
  readonly ts = inject(TraduccioService);
  private readonly dades = inject(DadesService);
  private readonly epocaService = inject(EpocaService);
  private readonly progresService = inject(ProgresService);
  private readonly nav = inject(NavegacioService);
  readonly motor = inject(MotorJocService);

  readonly esquerra = signal<Jugador | null>(null);
  readonly dreta = signal<Jugador | null>(null);
  readonly seleccio = signal<Costat | null>(null);
  readonly correcte = signal<boolean | null>(null);

  /** Ids dels jugadors ja sortits en aquesta partida, perquè no es repeteixin. */
  private readonly jugadorsVistos = signal<ReadonlySet<string>>(new Set());

  constructor() {
    this.iniciarParella();

    effect(() => {
      if (this.motor.estat() === 'guanyat') {
        this.progresService.registrarResultat(
          this.epocaService.epocaActual(),
          'joc1',
          this.motor.estrellesGuanyades()
        );
      }
    });
  }

  private iniciarParella(): void {
    const pool = this.dades.jugadors();
    const dos = triarNDiferents(pool, 2);
    this.esquerra.set(dos[0]);
    this.dreta.set(dos[1]);
    this.jugadorsVistos.set(new Set([dos[0].id, dos[1].id]));
    this.seleccio.set(null);
    this.correcte.set(null);
  }

  respondre(costat: Costat): void {
    if (this.seleccio() !== null) return;
    const esq = this.esquerra();
    const dre = this.dreta();
    if (!esq || !dre) return;

    this.seleccio.set(costat);
    const escollit = costat === 'esquerra' ? esq : dre;
    const altre = costat === 'esquerra' ? dre : esq;
    this.correcte.set(escollit.minutsClub >= altre.minutsClub);
  }

  seguent(): void {
    const encertat = this.correcte();
    if (encertat === null) return;
    this.motor.registrarResposta(encertat);
    if (this.motor.estat() !== 'jugant') return;

    const anteriorDreta = this.dreta();
    if (!anteriorDreta) return;
    const pool = this.dades.jugadors();
    const vistos = this.jugadorsVistos();
    const disponibles = pool.filter(j => !vistos.has(j.id));
    const nou = triarAleatori(disponibles.length > 0 ? disponibles : pool.filter(j => j.id !== anteriorDreta.id));

    this.esquerra.set(anteriorDreta);
    this.dreta.set(nou);
    this.jugadorsVistos.update(v => new Set(v).add(nou.id));
    this.seleccio.set(null);
    this.correcte.set(null);
  }

  reiniciar(): void {
    this.motor.reiniciar();
    this.iniciarParella();
  }

  tornarMenu(): void {
    this.nav.anarA('menu');
  }
}
