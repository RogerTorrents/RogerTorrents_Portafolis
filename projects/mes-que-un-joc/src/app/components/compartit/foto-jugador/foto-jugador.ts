import { Component, computed, effect, input, signal } from '@angular/core';
import { degradatJugador, inicialsJugador } from '../../../utils/avatar.util';

/**
 * Mostra la foto d'un jugador a `public/jugadors/<jugadorId>.jpg` si existeix.
 * Si no s'ha afegit el fitxer encara, es mostra un avatar il·lustrat de
 * reserva (inicials sobre degradat blaugrana determinista) perquè l'app
 * quedi completa des del primer dia. Es fa servir només `.jpg` (una sola
 * petició per jugador, no una cadena d'extensions) perquè cada intent
 * fallit queda registrat pel navegador com un error de xarxa a la consola.
 */
@Component({
  selector: 'app-foto-jugador',
  templateUrl: './foto-jugador.html',
  styleUrl: './foto-jugador.css',
})
export class FotoJugador {
  readonly jugadorId = input.required<string>();
  readonly nom = input.required<string>();
  readonly mida = input<'sm' | 'md' | 'lg'>('md');

  readonly senseFoto = signal(false);

  readonly src = computed(() => `jugadors/${this.jugadorId()}.jpg`);
  readonly inicials = computed(() => inicialsJugador(this.nom()));
  readonly degradat = computed(() => degradatJugador(this.jugadorId()));

  constructor() {
    effect(() => {
      this.jugadorId();
      this.senseFoto.set(false);
    });
  }

  onError(): void {
    this.senseFoto.set(true);
  }
}
