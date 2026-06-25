import {
  Component, signal, effect, OnDestroy, ElementRef, viewChild, AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VoronoiService, PaletaVoronoi } from '../../services/voronoi.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-fons-depantalla',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './fons-depantalla.html',
  styleUrl: './fons-depantalla.css',
})
export class FonsDepantalla implements AfterViewInit, OnDestroy {
  private readonly previewCanvas = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');
  private animId = 0;
  private punts: { x: number; y: number; vx: number; vy: number }[] = [];

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
    this.animarPreview();
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
  }

  restaurar(): void {
    this.voronoi.restaurar();
    this.nombrePuntsLocal.set(this.voronoi.nombrePunts());
    this.paletaLocal.set({ ...this.voronoi.paleta() });
    this.colorBase.set('#9cc3b0');
  }

  private inicialitzarPuntsPreview(n: number): void {
    const pw = 320;
    const ph = 200;
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

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d')!;
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
  }
}
