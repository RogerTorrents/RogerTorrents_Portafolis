import { Injectable, computed, signal, Signal } from '@angular/core';

export type WindowState = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  state: 'normal' | 'minimized' | 'maximized';
  visible: boolean;
  active: boolean;
  restoreBounds?: { x: number; y: number; width: number; height: number };
};

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  // Registre reactiu de finestres
  private readonly _finestres = signal<Record<string, WindowState>>({});
  private readonly _topZ = signal(100);

  // Retorna una senyal (computed) per a una finestra concreta
  getWindowSignal(id: string): Signal<WindowState | undefined> {
    return computed(() => this._finestres()[id]);
  }

  // Retorna totes les finestres (objecte)
  get finestres() {
    return this._finestres;
  }

  // Registra una finestra amb estat per defecte si no existeix
  registerWindow(id: string, title = 'Finestra', props?: Partial<WindowState>) {
    if (this._finestres()[id]) return;
    const z = this._topZ() + 1;
    this._topZ.set(z);
    const def: WindowState = {
      id,
      title,
      x: 120,
      y: 80,
      width: 640,
      height: 360,
      z,
      state: 'normal',
      visible: false,
      active: false,
    };
    this._finestres.update(f => ({ ...f, [id]: { ...def, ...props } }));
  }

  // Obre (o registra i obre) una finestra
  openWindow(id: string, title?: string) {
    if (!this._finestres()[id]) this.registerWindow(id, title ?? id);
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], visible: true, state: 'normal', active: true } }));
    this.bringToFront(id);
  }

  closeWindow(id: string) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], visible: false, active: false } }));
  }

  minimizeWindow(id: string) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], state: 'minimized', visible: false, active: false } }));
  }

  maximizeWindow(id: string) {
    if (!this._finestres()[id]) return;
    const cur = this._finestres()[id];
    if (cur.state === 'maximized') {
      const restore = cur.restoreBounds;
      if (restore) {
        this._finestres.update(f => ({
          ...f,
          [id]: {
            ...f[id],
            state: 'normal',
            x: restore.x,
            y: restore.y,
            width: restore.width,
            height: restore.height,
            restoreBounds: undefined,
          }
        }));
      } else {
        this._finestres.update(f => ({ ...f, [id]: { ...f[id], state: 'normal', restoreBounds: undefined } }));
      }
    } else {
      const restoreBounds = { x: cur.x, y: cur.y, width: cur.width, height: cur.height };
      const fullWidth = Math.max(window.innerWidth, cur.width);
      const fullHeight = Math.max(window.innerHeight - 40, cur.height);
      this._finestres.update(f => ({
        ...f,
        [id]: {
          ...f[id],
          state: 'maximized',
          x: 0,
          y: 0,
          width: fullWidth,
          height: fullHeight,
          restoreBounds,
        }
      }));
    }
    this.bringToFront(id);
  }

  // Porta la finestra al davant i actualitza z-index i focus
  bringToFront(id: string) {
    if (!this._finestres()[id]) return;
    const z = this._topZ() + 1;
    this._topZ.set(z);
    this._finestres.update(f => {
      const out: Record<string, WindowState> = {};
      for (const k of Object.keys(f)) {
        out[k] = { ...f[k], active: k === id };
      }
      out[id] = { ...out[id], z };
      return out;
    });
  }

  // Mou la finestra a coordenades noves
  moveWindow(id: string, x: number, y: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], x, y } }));
  }

  // Canvia la mida d'una finestra
  resizeWindow(id: string, width: number, height: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], width, height } }));
  }

  // Canvia la mida i posició alhora (per redimensionar des de costats esquerre/superior)
  resizeMoveWindow(id: string, x: number, y: number, width: number, height: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], x, y, width, height } }));
  }
}
