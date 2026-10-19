import { Injectable, computed, inject, signal, Signal } from '@angular/core';
import { DispositiuService } from './dispositiu.service';

/** Alçada de la barra de tasques; les finestres mai la poden tapar. */
export const ALCADA_TASKBAR = 40;

type Rectangle = { x: number; y: number; width: number; height: number };

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
  restoreBounds?: Rectangle;
  /** Estat que tenia la finestra just abans de minimitzar-la, per tornar-hi en restaurar. */
  estatAbansMinimitzar?: 'normal' | 'maximized';
};

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly _finestres = signal<Record<string, WindowState>>({});
  private readonly _muntades = signal<Set<string>>(new Set());
  private readonly _topZ = signal(100);
  private readonly _animTimeouts = new Map<string, any>();
  private _windowCount = 0;
  private readonly _cascade = 30;
  private readonly dispositiu = inject(DispositiuService);

  constructor() {
    // En tàctil, girar el dispositiu o mostrar/amagar la barra del navegador
    // canvia l'àrea visible: cal tornar a encabir-hi totes les finestres.
    window.addEventListener('resize', () => this.clampFinestres());
    window.visualViewport?.addEventListener('resize', () => this.clampFinestres());
  }

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
    const patch: Partial<WindowState> = { visible: true, state: this.estatEnMostrar(id), active: true, animState: '' };
    if (icon) patch.icon = icon;
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], ...patch } }));
    this.bringToFront(id);
  }

  restoreWindow(id: string) {
    this.clearAnim(id);
    if (!this._finestres()[id]) return;
    this.patchWindow(id, { visible: true, state: this.estatEnMostrar(id), active: true, animState: 'opening' });
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
    const actual = this._finestres()[id].state;
    if (actual !== 'minimized') this.patchWindow(id, { estatAbansMinimitzar: actual });
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
      const restore = cur.restoreBounds ? this.ajustarAPantalla(cur.restoreBounds) : undefined;
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
      const fullHeight = Math.max(window.innerHeight - ALCADA_TASKBAR, cur.height);
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
    const w = this._finestres()[id];
    if (!w) return;
    this.resizeMoveWindow(id, x, y, w.width, w.height);
  }

  resizeWindow(id: string, width: number, height: number) {
    const w = this._finestres()[id];
    if (!w) return;
    this.resizeMoveWindow(id, w.x, w.y, width, height);
  }

  resizeMoveWindow(id: string, x: number, y: number, width: number, height: number) {
    if (!this._finestres()[id]) return;
    const r = this.ajustarAPantalla({ x, y, width, height });
    this._finestres.update(f => ({ ...f, [id]: { ...f[id], ...r } }));
  }

  /**
   * Tàctil: torna a encabir totes les finestres (i la mida a la qual
   * tornaran quan es desmaximitzin) dins l'àrea visible actual. A
   * escriptori no fa res: allà es permet deixar finestres mig fora.
   */
  clampFinestres(): void {
    if (!this.dispositiu.tactil()) return;
    this._finestres.update(f => {
      const out: Record<string, WindowState> = {};
      let changed = false;
      for (const [id, w] of Object.entries(f)) {
        const r = this.ajustarAPantalla(w);
        const restore = w.restoreBounds ? this.ajustarAPantalla(w.restoreBounds) : undefined;
        const mouRect = r.x !== w.x || r.y !== w.y || r.width !== w.width || r.height !== w.height;
        const mouRestore = !!restore && (restore.x !== w.restoreBounds!.x || restore.y !== w.restoreBounds!.y
          || restore.width !== w.restoreBounds!.width || restore.height !== w.restoreBounds!.height);
        if (mouRect || mouRestore) {
          out[id] = { ...w, ...r, restoreBounds: restore };
          changed = true;
        } else {
          out[id] = w;
        }
      }
      return changed ? out : f;
    });
  }

  /**
   * En dispositius tàctils, retalla i desplaça el rectangle perquè quedi
   * sencer dins la pantalla (sense tapar la barra de tasques). A
   * escriptori el retorna tal qual.
   */
  private ajustarAPantalla(r: Rectangle): Rectangle {
    if (!this.dispositiu.tactil()) return { x: r.x, y: r.y, width: r.width, height: r.height };
    const vw = window.innerWidth;
    const vh = window.innerHeight - ALCADA_TASKBAR;
    const width = Math.min(Math.max(r.width, Math.min(320, vw)), vw);
    const height = Math.min(Math.max(r.height, Math.min(240, vh)), vh);
    return {
      width,
      height,
      x: Math.min(Math.max(r.x, 0), vw - width),
      y: Math.min(Math.max(r.y, 0), vh - height),
    };
  }

  /** En tornar a mostrar una finestra, recupera si estava maximitzada. */
  private estatEnMostrar(id: string): 'normal' | 'maximized' {
    const w = this._finestres()[id];
    if (!w) return 'normal';
    if (w.state === 'minimized') return w.estatAbansMinimitzar ?? 'normal';
    return w.state;
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
