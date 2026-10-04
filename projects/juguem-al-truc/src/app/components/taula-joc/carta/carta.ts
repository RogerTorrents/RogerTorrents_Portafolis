import { Component, computed, input } from '@angular/core';
import { Carta as CartaModel, etiquetaValor, rutaImatgeCarta } from '../../../models/carta.model';

@Component({
  selector: 'app-carta',
  imports: [],
  templateUrl: './carta.html',
  styleUrl: './carta.css',
})
export class Carta {
  readonly carta = input.required<CartaModel>();
  readonly seleccionada = input(false);
  readonly petita = input(false);

  protected readonly etiqueta = computed(() => etiquetaValor(this.carta().valor));
  protected readonly rutaImatge = computed(() => rutaImatgeCarta(this.carta()));
}
