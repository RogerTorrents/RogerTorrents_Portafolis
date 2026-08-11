import { Injectable, computed, signal } from '@angular/core';
import { RONDES_PER_COMPLETAR, VIDES_INICIALS } from '../models/joc.model';

export type EstatPartida = 'jugant' | 'guanyat' | 'perdut';

/**
 * Motor genèric compartit pels 4 minijocs: 5 vides, 10 rondes per completar.
 * Cada resposta incorrecta resta una vida; en arribar a 0 el joc s'acaba
 * sense estrelles. En completar les 10 rondes, les vides restants es
 * converteixen en estrelles guanyades. S'ha de proveir a nivell de cada
 * component de joc (`providers: [MotorJocService]`) perquè cada partida
 * tingui el seu propi estat independent.
 */
@Injectable()
export class MotorJocService {
  readonly totalRondes = RONDES_PER_COMPLETAR;

  readonly vides = signal(VIDES_INICIALS);
  readonly rondaActual = signal(1);
  readonly estat = signal<EstatPartida>('jugant');

  readonly estrellesGuanyades = computed(() => (this.estat() === 'guanyat' ? this.vides() : 0));

  /** Registra el resultat de la ronda actual i avança l'estat de la partida. */
  registrarResposta(correcta: boolean): void {
    if (this.estat() !== 'jugant') return;

    if (!correcta) {
      const videsRestants = this.vides() - 1;
      this.vides.set(videsRestants);
      if (videsRestants <= 0) {
        this.estat.set('perdut');
        return;
      }
    }

    if (this.rondaActual() >= this.totalRondes) {
      this.estat.set('guanyat');
    } else {
      this.rondaActual.update(r => r + 1);
    }
  }

  reiniciar(): void {
    this.vides.set(VIDES_INICIALS);
    this.rondaActual.set(1);
    this.estat.set('jugant');
  }
}
