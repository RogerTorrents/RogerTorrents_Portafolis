import { Component, input, model } from '@angular/core';
import { Carta as CartaModel } from '../../../models/carta.model';
import { Carta } from '../carta/carta';

@Component({
  selector: 'app-ma-jugador',
  imports: [Carta],
  templateUrl: './ma-jugador.html',
  styleUrl: './ma-jugador.css',
})
export class MaJugador {
  readonly cartes = input.required<readonly CartaModel[]>();
  readonly potJugar = input(false);
  /** Certa durant la decisió de la mà dels 11 pròpia: les cartes es veuen més grans (vegeu ma-jugador.css). */
  readonly ampliada = input(false);
  readonly cartaSeleccionada = model<string | null>(null);

  protected triar(cartaId: string): void {
    if (!this.potJugar()) return;
    this.cartaSeleccionada.update((actual) => (actual === cartaId ? null : cartaId));
  }
}
