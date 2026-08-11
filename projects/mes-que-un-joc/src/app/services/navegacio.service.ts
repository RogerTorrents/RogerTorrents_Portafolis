import { Injectable, signal } from '@angular/core';

export type PantallaId = 'menu' | 'joc1' | 'joc2' | 'joc3' | 'joc4';

@Injectable({ providedIn: 'root' })
export class NavegacioService {
  readonly pantalla = signal<PantallaId>('menu');

  anarA(pantalla: PantallaId): void {
    this.pantalla.set(pantalla);
  }
}
