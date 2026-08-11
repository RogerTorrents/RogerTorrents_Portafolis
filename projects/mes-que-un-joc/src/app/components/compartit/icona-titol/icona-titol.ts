import { Component, computed, effect, input, signal } from '@angular/core';

/**
 * Mostra la imatge d'un títol a `public/titols/<titolId>.png` si existeix.
 * Si no s'ha afegit el fitxer encara, es mostra una icona de trofeu
 * il·lustrada de reserva perquè l'app quedi completa des del primer dia.
 */
@Component({
  selector: 'app-icona-titol',
  templateUrl: './icona-titol.html',
  styleUrl: './icona-titol.css',
})
export class IconaTitol {
  readonly titolId = input.required<string>();
  readonly nom = input.required<string>();

  readonly senseImatge = signal(false);
  readonly src = computed(() => `titols/${this.titolId()}.png`);

  constructor() {
    effect(() => {
      this.titolId();
      this.senseImatge.set(false);
    });
  }

  onError(): void {
    this.senseImatge.set(true);
  }
}
