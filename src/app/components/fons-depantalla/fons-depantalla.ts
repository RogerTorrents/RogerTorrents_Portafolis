import {
  Component, signal, effect, OnDestroy, ElementRef, viewChild, AfterViewInit, inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VoronoiService, PaletaVoronoi } from '../../services/voronoi.service';
import { TranslationService } from '../../services/translation.service';
import { DispositiuService } from '../../services/dispositiu.service';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-fons-depantalla',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fons-depantalla.html',
  styleUrl: './fons-depantalla.css',
  host: {
    '[class.tactil]': 'dispositiu.tactil()',
    '[style.--proporcio-pantalla]': 'proporcioPantalla()',
  },
})
export class FonsDepantalla implements AfterViewInit, OnDestroy {
  private readonly previewCanvas = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');
  private animId = 0;
  private punts: { x: number; y: number; vx: number; vy: number }[] = [];
  readonly dispositiu = inject(DispositiuService);
  private readonly wm = inject(WindowManagerService);

  /** Mida lògica (px CSS) de la previsualització. A escriptori és sempre
   *  320×200; en tàctil segueix la caixa real del canvas (vegeu
   *  `ajustarCanvasTactil`), que té la proporció de la pantalla. */
  private amplada = 320;
  private alcada = 200;
  private observadorMida?: ResizeObserver;

  /** Proporció ample/alt de la pantalla: en tàctil la previsualització la
   *  copia, perquè sigui fidel al fons real del mòbil (vertical o no). */
  readonly proporcioPantalla = signal(window.innerWidth / window.innerHeight);
  private readonly onResize = () => this.proporcioPantalla.set(window.innerWidth / window.innerHeight);

  readonly nombrePuntsLocal: ReturnType<typeof signal<number>>;
  readonly colorBase = signal('#9cc3b0');
  private paletaLocal: ReturnType<typeof signal<PaletaVoronoi>>;

  constructor(
    readonly voronoi: VoronoiService,
    readonly ts: TranslationService,
  ) {
    this.nombrePuntsLocal = signal(voronoi.nombrePunts());
    this.paletaLocal = signal<PaletaVoronoi>({ ...voronoi.paleta() });

    effect(() => {
      const n = this.nombrePuntsLocal();
      const paleta = this.paletaLocal();
      this.inicialitzarPuntsPreview(n);
      void paleta;
    });
  }

  ngAfterViewInit() {
    this.inicialitzarPuntsPreview(this.nombrePuntsLocal());
    window.addEventListener('resize', this.onResize);
    const canvas = this.previewCanvas()?.nativeElement;
    if (canvas && this.dispositiu.tactil()) {
      this.observadorMida = new ResizeObserver(() => this.ajustarCanvasTactil(canvas));
      this.observadorMida.observe(canvas);
    }
    this.animarPreview();
  }

  /**
   * Tàctil: el canvas pren la mida de la seva caixa CSS multiplicada per la
   * densitat de la pantalla (màx. 2×, per no disparar el cost de dibuix) —
   * a 1 píxel per píxel CSS, en un mòbil 3× es veia borrós. Els punts es
   * reescalen a la nova mida en lloc de regenerar-se, perquè l'animació no
   * salti.
   */
  private ajustarCanvasTactil(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sx = w / this.amplada;
    const sy = h / this.alcada;
    for (const p of this.punts) {
      p.x *= sx;
      p.y *= sy;
    }
    this.amplada = w;
    this.alcada = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  onPuntsCanvi(valor: number): void {
    this.nombrePuntsLocal.set(valor);
    this.inicialitzarPuntsPreview(valor);
  }

  onColorCanvi(color: string): void {
    this.colorBase.set(color);
    this.paletaLocal.set(this.voronoi.generarPaletaDesDeColor(color));
  }

  acceptar(): void {
    this.voronoi.aplicar(this.nombrePuntsLocal(), this.paletaLocal());
    // Aplicar el fons tanca la finestra, igual que la X.
    this.wm.closeWindow('fons-depantalla');
  }

  restaurar(): void {
    this.voronoi.restaurar();
    this.nombrePuntsLocal.set(this.voronoi.nombrePunts());
    this.paletaLocal.set({ ...this.voronoi.paleta() });
    this.colorBase.set('#9cc3b0');
  }

  private inicialitzarPuntsPreview(n: number): void {
    const pw = this.amplada;
    const ph = this.alcada;
    this.punts = Array.from({ length: n }, () => ({
      x: Math.random() * pw,
      y: Math.random() * ph,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
  }

  private animarPreview = () => {
    const canvas = this.previewCanvas()?.nativeElement;
    if (!canvas) {
      this.animId = requestAnimationFrame(this.animarPreview);
      return;
    }

    const w = this.amplada;
    const h = this.alcada;
    const ctx = canvas.getContext('2d')!;
    // Escala de píxels lògics a píxels reals del canvas (1 a escriptori).
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    const colors = this.paletaLocal().colors;

    for (const p of this.punts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.max(0, Math.min(w, p.x));
      p.y = Math.max(0, Math.min(h, p.y));
    }

    this.dibuixarPreview(ctx, w, h, colors);
    this.animId = requestAnimationFrame(this.animarPreview);
  };

  private dibuixarPreview(
    ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[],
  ): void {
    const { celles, arestes } = this.voronoi.computarVoronoi(this.punts, w, h);

    for (const cella of celles) {
      ctx.fillStyle = colors[cella.idxPunt % colors.length];
      ctx.beginPath();
      const v = cella.vertices;
      ctx.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (const a of arestes) {
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x2, a.y2);
    }
    ctx.stroke();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animId);
    this.observadorMida?.disconnect();
    window.removeEventListener('resize', this.onResize);
  }
}
