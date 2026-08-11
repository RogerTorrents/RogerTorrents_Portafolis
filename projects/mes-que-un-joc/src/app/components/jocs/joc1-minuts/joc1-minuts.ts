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
    const nou = triarNDiferents(pool, 1, anteriorDreta)[0] ?? triarAleatori(pool);

    this.esquerra.set(anteriorDreta);
    this.dreta.set(nou);
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
