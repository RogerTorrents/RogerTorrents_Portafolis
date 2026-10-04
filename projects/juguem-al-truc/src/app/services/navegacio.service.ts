import { Injectable, signal } from '@angular/core';

export type Pantalla = 'menu' | 'crear' | 'unir' | 'com-jugar' | 'sala-espera' | 'transicio' | 'joc' | 'acabada';

@Injectable({ providedIn: 'root' })
export class NavegacioService {
  readonly pantalla = signal<Pantalla>('menu');

  anarA(pantalla: Pantalla): void {
    this.pantalla.set(pantalla);
  }
}
