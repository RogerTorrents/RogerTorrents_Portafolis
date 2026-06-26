import { Component, computed, signal, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WindowManagerService } from '../../services/window-manager.service';
import { TranslationService, Idioma } from '../../services/translation.service';

@Component({
  selector: 'app-taskbar',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './taskbar.html',
  styleUrls: ['./taskbar.css']
})
export class Taskbar implements OnInit, OnDestroy {
  @Output() reiniciar = new EventEmitter<void>();

  volum = signal(70);
  isMute = signal(false);
  mostrarVolum = signal(false);
  mostrarIdioma = signal(false);
  mostrarCalendari = signal(false);
  mostrarStart = signal(false);
  esPantallaCompleta = signal(!!document.fullscreenElement);

  time = signal(new Date());
  private timerId: any;

  idiomes: { codi: Idioma; nom: string }[] = [
    { codi: 'ca', nom: 'Català' },
    { codi: 'es', nom: 'Español' },
    { codi: 'en', nom: 'English' },
  ];

  idiomaActual = computed(() => this.ts.etiquetaIdioma());

  // Calendari
  mesCalendari = signal(new Date().getMonth());
  anyCalendari = signal(new Date().getFullYear());

  nomMes = computed(() => this.ts.t('months_' + this.mesCalendari()));

  diesSetmana = computed(() =>
    [0, 1, 2, 3, 4, 5, 6].map(i => this.ts.t('days_' + i))
  );

  diesCalendari = computed(() => {
    const mes = this.mesCalendari();
    const any = this.anyCalendari();
    const primerDia = new Date(any, mes, 1);
    const ultimDia = new Date(any, mes + 1, 0);

    let diaSetmana = primerDia.getDay();
    diaSetmana = diaSetmana === 0 ? 6 : diaSetmana - 1;

    const dies: { dia: number; actual: boolean; avui: boolean }[] = [];
    const diesMesAnterior = new Date(any, mes, 0).getDate();

    for (let i = diaSetmana - 1; i >= 0; i--) {
      dies.push({ dia: diesMesAnterior - i, actual: false, avui: false });
    }

    const avui = new Date();
    for (let d = 1; d <= ultimDia.getDate(); d++) {
      dies.push({
        dia: d,
        actual: true,
        avui: d === avui.getDate() && mes === avui.getMonth() && any === avui.getFullYear(),
      });
    }

    const restants = 42 - dies.length;
    for (let d = 1; d <= restants; d++) {
      dies.push({ dia: d, actual: false, avui: false });
    }

    return dies;
  });

  ordreTaskbar = signal<string[]>([]);

  openWindows = computed(() => {
    const f = this.wm.finestres();
    const ordre = this.ordreTaskbar();
    const obertes = Object.values(f).filter(w => w.visible || w.state === 'minimized');
    const idsObertes = new Set(obertes.map(w => w.id));

    const resultat = [];
    for (const id of ordre) {
      if (idsObertes.has(id)) resultat.push(f[id]);
    }
    for (const w of obertes) {
      if (!ordre.includes(w.id)) resultat.push(w);
    }
    return resultat;
  });

  constructor(
    private readonly wm: WindowManagerService,
    readonly ts: TranslationService,
  ) {}

  ngOnInit(): void {
    this.timerId = setInterval(() => this.time.set(new Date()), 1000);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerId);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('pointermove', this.onTaskDragMove);
    document.removeEventListener('pointerup', this.onTaskDragUp);
  }

  private onFullscreenChange = () => {
    this.esPantallaCompleta.set(!!document.fullscreenElement);
  };

  // Menú contextual (clic dret)
  contextMenuId = signal('');
  contextMenuPos = signal({ x: 0, y: 0 });

  obrirContextMenu(ev: MouseEvent, id: string) {
    ev.preventDefault();
    ev.stopPropagation();
    this.previewId.set('');
    this.contextMenuId.set(id);
    this.contextMenuPos.set({ x: ev.clientX, y: ev.clientY - 80 });
  }

  obrirDesDeMenu(id: string) {
    this.contextMenuId.set('');
    this.wm.openWindow(id);
  }

  tancarDesDeMenu(id: string) {
    this.contextMenuId.set('');
    this.wm.closeWindow(id);
  }

  // Preview al hover
  previewId = signal('');
  private previewTimeout: any;

  mostrarPreview(id: string) {
    clearTimeout(this.previewTimeout);
    this.previewId.set(id);
    requestAnimationFrame(() => this.renderPreviewMirror(id));
  }

  private renderPreviewMirror(id: string) {
    const container = document.querySelector('.preview-mirror') as HTMLElement;
    if (!container) return;

    const wrapper = document.querySelector(
      `app-window-wrapper[id="${id}"] .window-wrapper`
    ) as HTMLElement;
    if (!wrapper) return;

    const wasHidden = wrapper.style.display === 'none';
    if (wasHidden) {
      wrapper.style.visibility = 'hidden';
      wrapper.style.display = 'block';
    }

    const windowContent = wrapper.querySelector('.window-content') as HTMLElement;
    if (!windowContent || windowContent.offsetWidth === 0) {
      if (wasHidden) { wrapper.style.display = 'none'; wrapper.style.visibility = ''; }
      return;
    }

    const origW = windowContent.offsetWidth;
    const origH = windowContent.offsetHeight;

    const maxW = 260;
    const maxH = 150;
    const scale = Math.min(maxW / origW, maxH / origH);
    const previewW = Math.round(origW * scale);
    const previewH = Math.round(origH * scale);

    const body = container.parentElement!;
    body.style.height = previewH + 'px';

    const previewEl = body.closest('.task-preview') as HTMLElement;
    if (previewEl) previewEl.style.width = previewW + 'px';

    const clone = windowContent.cloneNode(true) as HTMLElement;
    clone.style.width = origW + 'px';
    clone.style.height = origH + 'px';
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.transformOrigin = 'top left';
    clone.style.transform = `scale(${scale})`;
    clone.style.overflow = 'hidden';
    clone.style.pointerEvents = 'none';
    clone.style.boxSizing = 'border-box';

    container.innerHTML = '';
    container.appendChild(clone);

    if (wasHidden) {
      wrapper.style.display = 'none';
      wrapper.style.visibility = '';
    }
  }

  amagarPreview() {
    this.previewTimeout = setTimeout(() => this.previewId.set(''), 200);
  }

  focusWindow(id: string) {
    this.previewId.set('');
    this.wm.openWindow(id);
  }

  tancarDesDePreview(id: string) {
    this.previewId.set('');
    this.wm.closeWindow(id);
  }

  // Drag reordenar taskbar
  idArrossegant = signal('');
  offsetArrossegar = signal(0);
  private dragTaskStartX = 0;
  private dragTaskComencat = false;
  private lastDragTaskTime = 0;

  toggleWindow(id: string) {
    if (Date.now() - this.lastDragTaskTime < 200) return;
    const w = this.wm.getWindowSignal(id)();
    if (!w) return;
    if (w.visible) {
      this.wm.minimizeWindow(id);
    } else {
      this.wm.restoreWindow(id);
    }
  }

  onTaskPointerDown(ev: PointerEvent, id: string) {
    if (ev.button !== 0) return;
    ev.preventDefault();

    this.idArrossegant.set(id);
    this.dragTaskStartX = ev.clientX;
    this.dragTaskComencat = false;
    this.offsetArrossegar.set(0);

    const openIds = this.openWindows().map(w => w.id);
    this.ordreTaskbar.set(openIds);

    document.addEventListener('pointermove', this.onTaskDragMove);
    document.addEventListener('pointerup', this.onTaskDragUp);
  }

  private onTaskDragMove = (ev: PointerEvent) => {
    if (!this.dragTaskComencat && Math.abs(ev.clientX - this.dragTaskStartX) < 5) return;
    this.dragTaskComencat = true;
    this.offsetArrossegar.set(ev.clientX - this.dragTaskStartX);
  };

  private onTaskDragUp = (ev: PointerEvent) => {
    if (this.dragTaskComencat) {
      this.lastDragTaskTime = Date.now();
      const dragId = this.idArrossegant();
      const buttons = Array.from(document.querySelectorAll('.task-icon[data-task-id]'));
      const others = buttons.filter(btn => btn.getAttribute('data-task-id') !== dragId);

      let insertIdx = 0;
      for (const btn of others) {
        const rect = btn.getBoundingClientRect();
        if (ev.clientX > rect.left + rect.width / 2) insertIdx++;
      }

      this.ordreTaskbar.update(ordre => {
        const nou = ordre.filter(id => id !== dragId);
        nou.splice(insertIdx, 0, dragId);
        return nou;
      });
    }
    this.idArrossegant.set('');
    this.offsetArrossegar.set(0);
    document.removeEventListener('pointermove', this.onTaskDragMove);
    document.removeEventListener('pointerup', this.onTaskDragUp);
  };

  toggleStart(ev: Event) {
    ev.stopPropagation();
    this.mostrarVolum.set(false);
    this.mostrarIdioma.set(false);
    this.mostrarCalendari.set(false);
    this.mostrarStart.update(v => !v);
  }

  pantallaCompleta() {
    this.mostrarStart.set(false);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => this.esPantallaCompleta.set(true));
    } else {
      document.exitFullscreen().then(() => this.esPantallaCompleta.set(false));
    }
  }

  onReiniciar() {
    this.mostrarStart.set(false);
    this.reiniciar.emit();
  }

  tancarPantalla() {
    this.mostrarStart.set(false);
    window.open('about:blank', '_self');
  }

  // Idioma
  toggleIdioma(ev: Event) {
    ev.stopPropagation();
    this.mostrarVolum.set(false);
    this.mostrarCalendari.set(false);
    this.mostrarIdioma.update(v => !v);
  }

  canviarIdioma(codi: Idioma) {
    this.ts.setLang(codi);
    this.mostrarIdioma.set(false);
  }

  // Volum
  toggleMute() {
    this.isMute.update(v => !v);
  }

  toggleVolumSlider(ev: Event) {
    ev.stopPropagation();
    this.mostrarCalendari.set(false);
    this.mostrarIdioma.set(false);
    this.mostrarVolum.update(v => !v);
  }

  onVolumChange(ev: Event) {
    const val = +(ev.target as HTMLInputElement).value;
    this.volum.set(val);
    if (val === 0) this.isMute.set(true);
    else this.isMute.set(false);
  }

  iconaVolum(): string {
    if (this.isMute() || this.volum() === 0) return '🔇';
    if (this.volum() < 50) return '🔉';
    return '🔊';
  }

  // Calendari
  toggleCalendari(ev: Event) {
    ev.stopPropagation();
    this.mostrarVolum.set(false);
    this.mostrarIdioma.set(false);
    if (!this.mostrarCalendari()) {
      const avui = new Date();
      this.mesCalendari.set(avui.getMonth());
      this.anyCalendari.set(avui.getFullYear());
    }
    this.mostrarCalendari.update(v => !v);
  }

  mesAnterior() {
    if (this.mesCalendari() === 0) {
      this.mesCalendari.set(11);
      this.anyCalendari.update(a => a - 1);
    } else {
      this.mesCalendari.update(m => m - 1);
    }
  }

  mesSeguent() {
    if (this.mesCalendari() === 11) {
      this.mesCalendari.set(0);
      this.anyCalendari.update(a => a + 1);
    } else {
      this.mesCalendari.update(m => m + 1);
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentClick(ev: PointerEvent) {
    const target = ev.target as HTMLElement;
    if (this.mostrarVolum() && !target.closest('.volum-popup') && !target.closest('.volum-btn')) {
      this.mostrarVolum.set(false);
    }
    if (this.mostrarIdioma() && !target.closest('.idioma-popup') && !target.closest('.idioma-btn')) {
      this.mostrarIdioma.set(false);
    }
    if (this.mostrarCalendari() && !target.closest('.calendari-popup') && !target.closest('.clock-area')) {
      this.mostrarCalendari.set(false);
    }
    if (this.mostrarStart() && !target.closest('.start-popup') && !target.closest('.start-btn')) {
      this.mostrarStart.set(false);
    }
    if (this.contextMenuId() && !target.closest('.context-menu')) {
      this.contextMenuId.set('');
    }
  }
}
