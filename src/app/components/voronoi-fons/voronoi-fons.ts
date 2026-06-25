import { Component, effect, OnDestroy, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { VoronoiService } from '../../services/voronoi.service';

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
  `,
})
export class VoronoiFons implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('voronoiCanvas');
  private animFrameId = 0;
  private punts: { x: number; y: number; vx: number; vy: number }[] = [];

  constructor(private readonly voronoi: VoronoiService) {
    effect(() => {
      const estat = this.voronoi.estat();
      this.inicialitzarPunts(estat.nombrePunts);
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    if (canvas.width !== w || canvas.height !== h) {
      if (canvas.width > 0 && canvas.height > 0) {
        const sx = w / canvas.width;
        const sy = h / canvas.height;
        for (const p of this.punts) {
          p.x *= sx;
          p.y *= sy;
        }
      }
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d')!;
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
