import { Component, effect, OnDestroy, ElementRef, viewChild, AfterViewInit, inject } from '@angular/core';
import { VoronoiService } from '../../services/voronoi.service';
import { DispositiuService } from '../../services/dispositiu.service';

@Component({
  selector: 'app-voronoi-fons',
  standalone: true,
  template: '<canvas #voronoiCanvas></canvas>',
  styles: `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* Tàctil: en mòbil \`100vh\` inclou la barra del navegador i no coincideix
       amb \`innerHeight\` (la mida a la qual es dibuixa): el fons quedava
       estirat. \`inset: 0\` ocupa exactament l'àrea visible. */
    @media (pointer: coarse) {
      :host {
        width: auto;
        height: auto;
        right: 0;
        bottom: 0;
      }
    }
  `,
})
export class VoronoiFons implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('voronoiCanvas');
  private animFrameId = 0;
  private punts: { x: number; y: number; vx: number; vy: number }[] = [];
  private readonly dispositiu = inject(DispositiuService);

  /** Píxels reals per píxel CSS: la densitat de la pantalla en tàctil
   *  (màx. 2×, per no disparar el cost de dibuix a pantalla completa) — a
   *  1× un mòbil de densitat 3 el veia borrós. A escriptori sempre 1. */
  private escala(): number {
    return this.dispositiu.tactil() ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  }

  private ampladaLogica = 0;
  private alcadaLogica = 0;

  constructor(private readonly voronoi: VoronoiService) {
    effect(() => {
      const estat = this.voronoi.estat();
      this.inicialitzarPunts(estat.nombrePunts);
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.ampladaLogica = window.innerWidth;
      this.alcadaLogica = window.innerHeight;
      canvas.width = Math.round(this.ampladaLogica * this.escala());
      canvas.height = Math.round(this.alcadaLogica * this.escala());
    }
    this.inicialitzarPunts(this.voronoi.nombrePunts());
    this.animarVoronoi();
  }

  private inicialitzarPunts(n: number): void {
    const w = window.innerWidth || 1920;
    const h = window.innerHeight || 1080;
    this.punts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));
  }

  private animarVoronoi = () => {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      this.animFrameId = requestAnimationFrame(this.animarVoronoi);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const escala = this.escala();
    const ampladaReal = Math.round(w * escala);
    const alcadaReal = Math.round(h * escala);
    if (canvas.width !== ampladaReal || canvas.height !== alcadaReal) {
      if (this.ampladaLogica > 0 && this.alcadaLogica > 0) {
        const sx = w / this.ampladaLogica;
        const sy = h / this.alcadaLogica;
        for (const p of this.punts) {
          p.x *= sx;
          p.y *= sy;
        }
      }
      canvas.width = ampladaReal;
      canvas.height = alcadaReal;
    }
    this.ampladaLogica = w;
    this.alcadaLogica = h;

    const ctx = canvas.getContext('2d');
    // Sense context 2D (navegador sense canvas) no es dibuixa ni s'anima el fons.
    if (!ctx) return;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    const colors = this.voronoi.paleta().colors;

    for (const p of this.punts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.max(0, Math.min(w, p.x));
      p.y = Math.max(0, Math.min(h, p.y));
    }

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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (const a of arestes) {
      ctx.moveTo(a.x1, a.y1);
      ctx.lineTo(a.x2, a.y2);
    }
    ctx.stroke();

    this.animFrameId = requestAnimationFrame(this.animarVoronoi);
  };

  ngOnDestroy() {
    cancelAnimationFrame(this.animFrameId);
  }
}
