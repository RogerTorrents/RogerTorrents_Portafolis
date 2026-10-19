import { Injectable, signal } from '@angular/core';

/**
 * Detecta si el dispositiu principal d'entrada és tàctil (mòbil / tauleta),
 * via `(pointer: coarse)` — el punter PRINCIPAL. Tot el comportament mòbil
 * de GeoExplorer (JS i CSS) es lliga a aquesta mateixa condició, perquè un
 * ordinador amb ratolí mai el vegi, ni amb la finestra estreta.
 */
@Injectable({ providedIn: 'root' })
export class DispositiuService {
  private readonly consulta = window.matchMedia('(pointer: coarse)');
  private readonly _tactil = signal(this.consulta.matches);

  readonly tactil = this._tactil.asReadonly();

  constructor() {
    this.consulta.addEventListener('change', ev => this._tactil.set(ev.matches));
  }
}
