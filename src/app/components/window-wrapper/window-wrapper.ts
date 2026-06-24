import { Component, Input, OnInit, Signal } from '@angular/core';
import { WindowManagerService, WindowState } from '../../services/window-manager.service';

@Component({
  selector: 'app-window-wrapper',
  standalone: true,
  templateUrl: './window-wrapper.html',
  styleUrls: ['./window-wrapper.css']
})
export class WindowWrapper implements OnInit {
  @Input() id = '';
  @Input() title = '';

  // Senyal reactiva a l'estat d'aquesta finestra (si existeix al gestor)
  state!: Signal<WindowState | undefined>;

  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private resizing = false;
  private resizeDirection = '';
  private resizeStart = { x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0 };

  constructor(private readonly wm: WindowManagerService) {}

  ngOnInit(): void {
    if (!this.id) throw new Error('window-wrapper necessita un `id`');
    this.wm.registerWindow(this.id, this.title || undefined);
    this.state = this.wm.getWindowSignal(this.id);
  }

  onHeaderPointerDown(ev: PointerEvent) {
    const s = this.wm.getWindowSignal(this.id)();
    if (!s || s.state === 'maximized') return;
    this.wm.bringToFront(this.id);
    this.dragging = true;
    this.dragOffset.x = ev.clientX - s.x;
    this.dragOffset.y = ev.clientY - s.y;
    (document as any).addEventListener('pointermove', this.onPointerMove);
    (document as any).addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (ev: PointerEvent) => {
    if (this.dragging) {
      const s = this.wm.getWindowSignal(this.id)();
      const w = s?.width ?? 320;
      const minVisible = 100;
      const nx = Math.max(-w + minVisible, Math.min(ev.clientX - this.dragOffset.x, window.innerWidth - minVisible));
      const ny = Math.max(0, Math.min(ev.clientY - this.dragOffset.y, window.innerHeight - 40 - 32));
      this.wm.moveWindow(this.id, nx, ny);
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

      this.wm.resizeMoveWindow(this.id, x, y, w, h);
    }
  };

  private onPointerUp = (_ev: PointerEvent) => {
    this.dragging = false;
    this.resizing = false;
    (document as any).removeEventListener('pointermove', this.onPointerMove);
    (document as any).removeEventListener('pointerup', this.onPointerUp);
  };

  close() {
    this.wm.closeWindow(this.id);
  }

  minimize() {
    this.wm.minimizeWindow(this.id);
  }

  maximize() {
    this.wm.maximizeWindow(this.id);
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
