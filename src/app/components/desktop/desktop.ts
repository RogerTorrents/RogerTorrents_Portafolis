import { Component, computed, signal, OnDestroy } from '@angular/core';
import { WindowManagerService } from '../../services/window-manager.service';
import { TranslationService } from '../../services/translation.service';
import { AppIcon } from '../base/app-icon/app-icon';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [AppIcon],
  templateUrl: './desktop.html',
  styleUrls: ['./desktop.css']
})
export class Desktop implements OnDestroy {
  private readonly appDefs = [
    { id: 'sobre-mi', nameKey: 'app_sobre_mi', icon: '👤', showInDesktop: true },
    { id: 'habilitats', nameKey: 'app_habilitats', icon: '⚙️', showInDesktop: true },
    { id: 'contactar', nameKey: 'app_contactar', icon: '✉️', showInDesktop: true },
    { id: 'fons-depantalla', nameKey: 'app_fons_depantalla', icon: '🎨', showInDesktop: true },
  ];

  isMobile = computed(() => window.innerWidth <= 650);
  desktopApps = computed(() =>
    this.appDefs.filter(a => a.showInDesktop).map(a => ({ ...a, name: this.ts.t(a.nameKey) }))
  );

  onTaskbarApps = computed(() => {
    const wins = Object.values(this.wm.finestres() || {});
    return wins.filter(w => w.visible || w.state === 'minimized');
  });

  // Quadrícula
  private readonly gridW = 85;
  private readonly gridH = 95;
  private readonly gridPadding = 10;

  posicionsIcones = signal<Record<string, { x: number; y: number }>>(
    this.appDefs.reduce((acc: Record<string, { x: number; y: number }>, app, i) => ({
      ...acc,
      [app.id]: this.snapToGrid(this.gridPadding, this.gridPadding + i * this.gridH)
    }), {} as Record<string, { x: number; y: number }>)
  );

  // Selecció rectangular
  seleccionant = signal(false);
  rectSeleccio = signal({ x: 0, y: 0, width: 0, height: 0 });
  appsSeleccionades = signal<Set<string>>(new Set());

  // Drag d'icones
  idsArrossegant = signal<Set<string>>(new Set());
  private iconesArrossegades: { id: string; offsetX: number; offsetY: number }[] = [];
  private dragIconaStart = { x: 0, y: 0 };
  private dragComencat = false;
  private lastDragTime = 0;
  private readonly dragThreshold = 5;

  // Selecció rectangular
  private iniciSeleccio = { x: 0, y: 0 };

  constructor(private readonly wm: WindowManagerService, readonly ts: TranslationService) {}

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const maxX = Math.floor((window.innerWidth - this.gridPadding - this.gridW) / this.gridW) * this.gridW + this.gridPadding;
    const maxY = Math.floor((window.innerHeight - 40 - this.gridPadding - this.gridH) / this.gridH) * this.gridH + this.gridPadding;
    const sx = Math.round((x - this.gridPadding) / this.gridW) * this.gridW + this.gridPadding;
    const sy = Math.round((y - this.gridPadding) / this.gridH) * this.gridH + this.gridPadding;
    return {
      x: Math.max(this.gridPadding, Math.min(sx, maxX)),
      y: Math.max(this.gridPadding, Math.min(sy, maxY)),
    };
  }

  openApp(app: any) {
    if (Date.now() - this.lastDragTime < 200) return;
    this.wm.openWindow(app.id, app.name, app.icon);
  }

  tapApp(app: any) {
    if (Date.now() - this.lastDragTime < 200) return;
    if (this.isMobile()) this.openApp(app);
  }

  esSeleccionada(appId: string): boolean {
    return this.appsSeleccionades().has(appId);
  }

  esArrossegant(appId: string): boolean {
    return this.idsArrossegant().has(appId);
  }

  // --- Drag d'icones (individual o múltiple) ---

  onIconaPointerDown(ev: PointerEvent, app: any) {
    if (ev.button !== 0) return;
    ev.stopPropagation();

    this.dragComencat = false;
    this.dragIconaStart = { x: ev.clientX, y: ev.clientY };

    const seleccionades = this.appsSeleccionades();

    if (seleccionades.has(app.id)) {
      this.iconesArrossegades = [...seleccionades].map(id => {
        const pos = this.posicionsIcones()[id];
        return { id, offsetX: ev.clientX - pos.x, offsetY: ev.clientY - pos.y };
      });
    } else {
      this.appsSeleccionades.set(new Set());
      const pos = this.posicionsIcones()[app.id];
      this.iconesArrossegades = [{ id: app.id, offsetX: ev.clientX - pos.x, offsetY: ev.clientY - pos.y }];
    }

    document.addEventListener('pointermove', this.onIconaDragMove);
    document.addEventListener('pointerup', this.onIconaDragUp);
  }

  private onIconaDragMove = (ev: PointerEvent) => {
    const dx = ev.clientX - this.dragIconaStart.x;
    const dy = ev.clientY - this.dragIconaStart.y;

    if (!this.dragComencat && Math.abs(dx) + Math.abs(dy) < this.dragThreshold) return;
    if (!this.dragComencat) {
      this.dragComencat = true;
      this.idsArrossegant.set(new Set(this.iconesArrossegades.map(i => i.id)));
    }

    this.posicionsIcones.update(p => {
      const updated = { ...p };
      for (const icona of this.iconesArrossegades) {
        updated[icona.id] = {
          x: ev.clientX - icona.offsetX,
          y: ev.clientY - icona.offsetY,
        };
      }
      return updated;
    });
  };

  private onIconaDragUp = () => {
    if (this.dragComencat) {
      this.lastDragTime = Date.now();
      const idsMovent = new Set(this.iconesArrossegades.map(i => i.id));
      this.posicionsIcones.update(p => {
        const updated = { ...p };
        const ocupades = new Set<string>();
        for (const [id, pos] of Object.entries(updated)) {
          if (!idsMovent.has(id)) ocupades.add(`${pos.x},${pos.y}`);
        }
        for (const icona of this.iconesArrossegades) {
          let target = this.snapToGrid(updated[icona.id].x, updated[icona.id].y);
          target = this.trobarLliure(target, ocupades);
          updated[icona.id] = target;
          ocupades.add(`${target.x},${target.y}`);
        }
        return updated;
      });
    }
    this.idsArrossegant.set(new Set());
    this.iconesArrossegades = [];
    document.removeEventListener('pointermove', this.onIconaDragMove);
    document.removeEventListener('pointerup', this.onIconaDragUp);
  };

  private trobarLliure(
    target: { x: number; y: number },
    ocupades: Set<string>
  ): { x: number; y: number } {
    const clau = `${target.x},${target.y}`;
    if (!ocupades.has(clau)) return target;
    let dist = 1;
    while (dist < 50) {
      for (let dx = -dist; dx <= dist; dx++) {
        for (let dy = -dist; dy <= dist; dy++) {
          if (Math.abs(dx) !== dist && Math.abs(dy) !== dist) continue;
          const candidate = {
            x: target.x + dx * this.gridW,
            y: target.y + dy * this.gridH,
          };
          const maxX = window.innerWidth - this.gridW;
          const maxY = window.innerHeight - 40 - this.gridH;
          if (candidate.x < 0 || candidate.y < 0 || candidate.x > maxX || candidate.y > maxY) continue;
          if (!ocupades.has(`${candidate.x},${candidate.y}`)) return candidate;
        }
      }
      dist++;
    }
    return target;
  }

  // --- Selecció rectangular ---

  onDesktopPointerDown(ev: PointerEvent) {
    if ((ev.target as HTMLElement).closest('app-icon, app-taskbar, app-window-wrapper, button')) return;
    if (ev.button !== 0) return;

    this.appsSeleccionades.set(new Set());
    this.seleccionant.set(true);
    this.iniciSeleccio = { x: ev.clientX, y: ev.clientY };
    this.rectSeleccio.set({ x: ev.clientX, y: ev.clientY, width: 0, height: 0 });

    document.addEventListener('pointermove', this.onSeleccioMove);
    document.addEventListener('pointerup', this.onSeleccioUp);
  }

  private onSeleccioMove = (ev: PointerEvent) => {
    const x = Math.min(ev.clientX, this.iniciSeleccio.x);
    const y = Math.min(ev.clientY, this.iniciSeleccio.y);
    const width = Math.abs(ev.clientX - this.iniciSeleccio.x);
    const height = Math.abs(ev.clientY - this.iniciSeleccio.y);
    this.rectSeleccio.set({ x, y, width, height });
    this.actualitzarSeleccio();
  };

  private onSeleccioUp = () => {
    this.seleccionant.set(false);
    document.removeEventListener('pointermove', this.onSeleccioMove);
    document.removeEventListener('pointerup', this.onSeleccioUp);
  };

  private actualitzarSeleccio() {
    const rect = this.rectSeleccio();
    const seleccionades = new Set<string>();
    const icones = document.querySelectorAll('app-icon[data-app-id]');
    icones.forEach(icona => {
      const bounds = icona.getBoundingClientRect();
      const id = icona.getAttribute('data-app-id');
      if (id && this.rectanglesIntersecten(rect, bounds)) {
        seleccionades.add(id);
      }
    });
    this.appsSeleccionades.set(seleccionades);
  }

  private rectanglesIntersecten(
    a: { x: number; y: number; width: number; height: number },
    b: DOMRect
  ): boolean {
    return !(a.x + a.width < b.left || a.x > b.right || a.y + a.height < b.top || a.y > b.bottom);
  }

  ngOnDestroy() {
    document.removeEventListener('pointermove', this.onSeleccioMove);
    document.removeEventListener('pointerup', this.onSeleccioUp);
    document.removeEventListener('pointermove', this.onIconaDragMove);
    document.removeEventListener('pointerup', this.onIconaDragUp);
  }
}
