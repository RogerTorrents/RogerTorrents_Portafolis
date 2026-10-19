import { Injectable, signal } from '@angular/core';

/**
 * Detecta si el dispositiu principal d'entrada és tàctil (mòbil / tauleta).
 *
 * Es fa servir `(pointer: coarse)` — el punter PRINCIPAL — i no
 * `any-pointer`, perquè un portàtil amb pantalla tàctil però amb ratolí o
 * trackpad ha de continuar comportant-se com un escriptori normal. Una
 * tauleta amb teclat i trackpad connectats passa a `pointer: fine` i, per
 * tant, també recupera el comportament d'escriptori.
 */
@Injectable({ providedIn: 'root' })
export class DispositiuService {
  private readonly consulta = window.matchMedia('(pointer: coarse)');
  private readonly _tactil = signal(this.consulta.matches);

  /** `true` en mòbils i tauletes tàctils. */
  readonly tactil = this._tactil.asReadonly();

  constructor() {
    this.consulta.addEventListener('change', ev => this._tactil.set(ev.matches));
  }
}
