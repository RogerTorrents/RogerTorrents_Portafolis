import { Injectable, computed, signal, Signal } from '@angular/core';

export type WindowState = {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  state: 'normal' | 'minimized' | 'maximized';
  visible: boolean;
  active: boolean;
  animState: 'opening' | 'closing' | '';
  restoreBounds?: { x: number; y: number; width: number; height: number };
};

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly _finestres = signal<Record<string, WindowState>>({});
  private readonly _muntades = signal<Set<string>>(new Set());
  private readonly _topZ = signal(100);
  private readonly _animTimeouts = new Map<string, any>();
  private _windowCount = 0;
  private readonly _cascade = 30;

  getWindowSignal(id: string): Signal<WindowState | undefined> {
    return computed(() => this._finestres()[id]);
  }

  get finestres() {
    return this._finestres;
  }

  get muntades() {
    return this._muntades;
  }

  registerWindow(id: string, title = 'Finestra', props?: Partial<WindowState>) {
    if (this._finestres()[id]) return;
    const z = this._topZ() + 1;
    this._topZ.set(z);
    const def: WindowState = {
      id,
      title,
      icon: '',
      x: 120 + this._windowCount * this._cascade,
      y: 80 + this._windowCount * this._cascade,
      width: 640,
      height: 360,
      z,
      state: 'normal',
      visible: false,
      active: false,
      animState: '',
    };
    this._finestres.update(f => ({ ...f, [id]: { ...def, ...props } }));
    this._windowCount++;
  }

  openWindow(id: string, title?: string, icon?: string) {
    this.clearAnim(id);
    this._muntades.update(s => new Set([...s, id]));
    if (!this._finestres()[id]) this.registerWindow(id, title ?? id);
    const patch: Partial<WindowState> = { visible: true, state: 'normal', active: true, animState: '' };
    if (icon) patch.icon = icon;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], ...patch } }));
    this.bringToFront(id);
  }

  restoreWindow(id: string) {
    this.clearAnim(id);
    if (!this._finestres()[id]) return;
    this.patchWindow(id, { visible: true, state: 'normal', active: true, animState: 'opening' });
    this.bringToFront(id);
    this._animTimeouts.set(id, setTimeout(() => {
      this.patchWindow(id, { animState: '' });
      this._animTimeouts.delete(id);
    }, 200));
  }

  closeWindow(id: string) {
    if (!this._finestres()[id]) return;
    this.clearAnim(id);
    this._muntades.update(s => { const n = new Set(s); n.delete(id); return n; });
    this._finestres.update(f => { const { [id]: _, ...rest } = f; return rest; });
  }

  minimizeWindow(id: string) {
    if (!this._finestres()[id]) return;
    this.clearAnim(id);
    this.patchWindow(id, { animState: 'closing' });
    this._animTimeouts.set(id, setTimeout(() => {
      this.patchWindow(id, { state: 'minimized', visible: false, active: false, animState: '' });
      this._animTimeouts.delete(id);
    }, 150));
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

  updateTitle(id: string, title: string) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], title } }));
  }

  moveWindow(id: string, x: number, y: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], x, y } }));
  }

  resizeWindow(id: string, width: number, height: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], width, height } }));
  }

  resizeMoveWindow(id: string, x: number, y: number, width: number, height: number) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], x, y, width, height } }));
  }

  clampFinestres(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight - 40;
    const marge = 80;

    this._finestres.update(f => {
      const out: Record<string, WindowState> = {};
      let changed = false;
      for (const [id, w] of Object.entries(f)) {
        if (!w.visible || w.state === 'maximized') {
          out[id] = w;
          continue;
        }
        let { x, y } = w;
        if (x + w.width < marge) x = marge - w.width;
        if (x > vw - marge) x = vw - marge;
        if (y < 0) y = 0;
        if (y > vh - marge) y = vh - marge;
        if (x !== w.x || y !== w.y) {
          out[id] = { ...w, x, y };
          changed = true;
        } else {
          out[id] = w;
        }
      }
      return changed ? out : f;
    });
  }

  private patchWindow(id: string, patch: Partial<WindowState>) {
    if (!this._finestres()[id]) return;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], ...patch } }));
  }

  private clearAnim(id: string) {
    const t = this._animTimeouts.get(id);
    if (t) { clearTimeout(t); this._animTimeouts.delete(id); }
  }
}
