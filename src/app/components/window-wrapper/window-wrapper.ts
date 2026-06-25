import { Component, Input, OnInit, OnChanges, SimpleChanges, Signal, signal, computed } from '@angular/core';
import { WindowManagerService, WindowState } from '../../services/window-manager.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-window-wrapper',
  standalone: true,
  templateUrl: './window-wrapper.html',
  styleUrls: ['./window-wrapper.css']
})
export class WindowWrapper implements OnInit, OnChanges {
  @Input() id = '';
  @Input() title = '';

  state!: Signal<WindowState | undefined>;

  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private pendingUnmaximize = false;
  private unmaxStartY = 0;
  private unmaxMouseX = 0;
  private resizing = false;
  private resizeDirection = '';
  private resizeStart = { x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0 };

  snapZone = signal<'' | 'left' | 'right' | 'maximize'>('');
  showSnapAssist = signal(false);
  snapAssistSide = signal<'left' | 'right'>('left');

  altresFinestres = computed(() => {
    const f = this.wm.finestres();
    return Object.values(f).filter(w => w.id !== this.id && (w.visible || w.state === 'minimized'));
  });

  constructor(private readonly wm: WindowManagerService, readonly ts: TranslationService) {}

  ngOnInit(): void {
    if (!this.id) throw new Error('window-wrapper necessita un `id`');
    this.wm.registerWindow(this.id, this.title || undefined);
    this.state = this.wm.getWindowSignal(this.id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title'] && !changes['title'].firstChange) {
      this.wm.updateTitle(this.id, this.title);
    }
  }

  onHeaderPointerDown(ev: PointerEvent) {
    const s = this.wm.getWindowSignal(this.id)();
    if (!s) return;
    this.wm.bringToFront(this.id);
    this.showSnapAssist.set(false);

    if (s.state === 'maximized') {
      this.pendingUnmaximize = true;
      this.unmaxStartY = ev.clientY;
      this.unmaxMouseX = ev.clientX;
      (document as any).addEventListener('pointermove', this.onPointerMove);
      (document as any).addEventListener('pointerup', this.onPointerUp);
      return;
    }

    this.dragging = true;
    this.dragOffset.x = ev.clientX - s.x;
    this.dragOffset.y = ev.clientY - s.y;
    (document as any).addEventListener('pointermove', this.onPointerMove);
    (document as any).addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (ev: PointerEvent) => {
    if (this.pendingUnmaximize) {
      if (Math.abs(ev.clientY - this.unmaxStartY) > 5) {
        this.pendingUnmaximize = false;
        const s = this.wm.getWindowSignal(this.id)();
        const restoreW = s?.restoreBounds?.width ?? 640;
        const ratio = this.unmaxMouseX / window.innerWidth;
        const nx = this.unmaxMouseX - restoreW * ratio;
        this.wm.maximizeWindow(this.id);
        this.wm.moveWindow(this.id, nx, ev.clientY - 16);
        this.dragging = true;
        this.dragOffset.x = ev.clientX - nx;
        this.dragOffset.y = 16;
      }
      return;
    }
    if (this.dragging) {
      const s = this.wm.getWindowSignal(this.id)();
      const w = s?.width ?? 320;
      const minVisible = 100;
      const nx = Math.max(-w + minVisible, Math.min(ev.clientX - this.dragOffset.x, window.innerWidth - minVisible));
      const ny = Math.max(0, Math.min(ev.clientY - this.dragOffset.y, window.innerHeight - 40 - 32));
      this.wm.moveWindow(this.id, nx, ny);

      if (ev.clientX <= 5) this.snapZone.set('left');
      else if (ev.clientX >= window.innerWidth - 5) this.snapZone.set('right');
      else if (ev.clientY <= 5) this.snapZone.set('maximize');
      else this.snapZone.set('');
      return;
    }
    if (this.resizing) {
      const dx = ev.clientX - this.resizeStart.x;
      const dy = ev.clientY - this.resizeStart.y;
      const dir = this.resizeDirection;
      let { winX: x, winY: y, width: w, height: h } = this.resizeStart;

      if (dir.includes('e')) w = this.resizeStart.width + dx;
      if (dir.includes('w')) { w = this.resizeStart.width - dx; x = this.resizeStart.winX + dx; }
      if (dir.includes('s')) h = this.resizeStart.height + dy;
      if (dir.includes('n')) { h = this.resizeStart.height - dy; y = this.resizeStart.winY + dy; }

      if (w < 320) { if (dir.includes('w')) x = this.resizeStart.winX + this.resizeStart.width - 320; w = 320; }
      if (h < 240) { if (dir.includes('n')) y = this.resizeStart.winY + this.resizeStart.height - 240; h = 240; }

      const maxW = window.innerWidth;
      const maxH = window.innerHeight - 40;
      const minVisible = 100;

      if (dir.includes('n') && y < 0) { h += y; y = 0; }
      if (dir.includes('w') && x < 0) { w += x; x = 0; }
      if (dir.includes('e') && x + w > maxW) { w = maxW - x; }
      if (dir.includes('s') && y + h > maxH) { h = maxH - y; }

      y = Math.min(y, maxH - 32);
      x = Math.max(-w + minVisible, Math.min(x, maxW - minVisible));

      this.wm.resizeMoveWindow(this.id, x, y, w, h);
    }
  };

  private onPointerUp = (_ev: PointerEvent) => {
    if (this.dragging) {
      const zone = this.snapZone();
      if (zone === 'maximize') {
        this.wm.maximizeWindow(this.id);
      } else if (zone === 'left' || zone === 'right') {
        this.snapToSide(zone);
      }
    }
    this.snapZone.set('');
    this.dragging = false;
    this.resizing = false;
    this.pendingUnmaximize = false;
    (document as any).removeEventListener('pointermove', this.onPointerMove);
    (document as any).removeEventListener('pointerup', this.onPointerUp);
  };

  private snapToSide(side: 'left' | 'right') {
    const halfW = Math.floor(window.innerWidth / 2);
    const fullH = window.innerHeight - 40;
    const x = side === 'left' ? 0 : halfW;
    this.wm.resizeMoveWindow(this.id, x, 0, halfW, fullH);

    const altres = this.altresFinestres();
    if (altres.length > 0) {
      this.snapAssistSide.set(side === 'left' ? 'right' : 'left');
      this.showSnapAssist.set(true);
    }
  }

  seleccionarSnapAssist(id: string) {
    const side = this.snapAssistSide();
    const halfW = Math.floor(window.innerWidth / 2);
    const fullH = window.innerHeight - 40;
    const x = side === 'left' ? 0 : halfW;
    this.wm.openWindow(id);
    this.wm.resizeMoveWindow(id, x, 0, halfW, fullH);
    this.showSnapAssist.set(false);
  }

  tancarSnapAssist() {
    this.showSnapAssist.set(false);
  }

  close() {
    this.wm.closeWindow(this.id);
  }

  minimize() {
    this.wm.minimizeWindow(this.id);
  }

  maximize() {
    this.wm.maximizeWindow(this.id);
  }

  getAnimOrigin(): string {
    const s = this.state();
    if (!s || !s.animState) return '';
    const btn = document.querySelector(`[data-task-id="${this.id}"]`) as HTMLElement | null;
    if (!btn) return 'center bottom';
    const rect = btn.getBoundingClientRect();
    const ox = rect.left + rect.width / 2 - s.x;
    const oy = rect.top + rect.height / 2 - s.y;
    return `${ox}px ${oy}px`;
  }

  onResizePointerDown(ev: PointerEvent, direction: string) {
    ev.stopPropagation();
    const s = this.wm.getWindowSignal(this.id)();
    if (!s || s.state === 'maximized') return;
    this.resizing = true;
    this.resizeDirection = direction;
    this.resizeStart = { x: ev.clientX, y: ev.clientY, width: s.width, height: s.height, winX: s.x, winY: s.y };
    this.wm.bringToFront(this.id);
    (document as any).addEventListener('pointermove', this.onPointerMove);
    (document as any).addEventListener('pointerup', this.onPointerUp);
  }
}
