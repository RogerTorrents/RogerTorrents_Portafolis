import { Injectable, signal, computed } from '@angular/core';

export interface PaletaVoronoi {
  nom: string;
  colors: string[];
}

export interface EstatVoronoi {
  nombrePunts: number;
  paleta: PaletaVoronoi;
}

const PALETA_PER_DEFECTE: PaletaVoronoi = {
  nom: 'Ales de libèl·lula',
  colors: [
    '#d4e4bc', '#b8d4a3', '#9cc3b0', '#7eb8c9',
    '#a3c4d4', '#c9dae0', '#e2ece4', '#c5d9c3',
    '#aecfb8', '#8bbfa5', '#d9e8d2', '#b0d0c4',
  ],
};

const NOMBRE_PUNTS_PER_DEFECTE = 32;

@Injectable({ providedIn: 'root' })
export class VoronoiService {
  readonly nombrePunts = signal(NOMBRE_PUNTS_PER_DEFECTE);
  readonly paleta = signal<PaletaVoronoi>({ ...PALETA_PER_DEFECTE });

  readonly estat = computed<EstatVoronoi>(() => ({
    nombrePunts: this.nombrePunts(),
    paleta: this.paleta(),
  }));

  aplicar(punts: number, paleta: PaletaVoronoi): void {
    this.nombrePunts.set(punts);
    this.paleta.set({ ...paleta });
  }

  restaurar(): void {
    this.nombrePunts.set(NOMBRE_PUNTS_PER_DEFECTE);
    this.paleta.set({ ...PALETA_PER_DEFECTE });
  }

  generarPaletaDesDeColor(colorBase: string): PaletaVoronoi {
    const { h, s, l } = this.hexAHsl(colorBase);
    const colors: string[] = [];
    for (let i = 0; i < 12; i++) {
      const hVariat = (h + (i * 8 - 20) + 360) % 360;
      const sVariada = Math.max(10, Math.min(60, s + (i % 3 - 1) * 12));
      const lVariada = Math.max(55, Math.min(90, l + (i % 4 - 1.5) * 8));
      colors.push(this.hslAHex(hVariat, sVariada, lVariada));
    }
    return { nom: 'Personalitzada', colors };
  }

  private hexAHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslAHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }

  computarVoronoi(
    punts: { x: number; y: number }[],
    w: number,
    h: number,
  ): {
    celles: { vertices: { x: number; y: number }[]; idxPunt: number }[];
    arestes: { x1: number; y1: number; x2: number; y2: number }[];
  } {
    const n = punts.length;
    if (n < 2) return { celles: [], arestes: [] };

    const M = Math.max(w, h) * 10;
    const tots: { x: number; y: number }[] = [
      ...punts,
      { x: -M, y: -M },
      { x: 3 * M, y: -M },
      { x: -M, y: 3 * M },
    ];

    let tris: number[][] = [[n, n + 1, n + 2]];

    for (let i = 0; i < n; i++) {
      const p = tots[i];
      const dolents: number[][] = [];
      for (const tri of tris) {
        if (this.puntEnCircumcercle(tots, tri, p)) dolents.push(tri);
      }

      const frontera: [number, number][] = [];
      for (const tri of dolents) {
        for (let e = 0; e < 3; e++) {
          const a = tri[e], b = tri[(e + 1) % 3];
          let compartida = false;
          for (const altre of dolents) {
            if (altre === tri) continue;
            if (this.triTeAresta(altre, a, b)) { compartida = true; break; }
          }
          if (!compartida) frontera.push([a, b]);
        }
      }

      tris = tris.filter(t => !dolents.includes(t));
      for (const [a, b] of frontera) tris.push([i, a, b]);
    }

    const circumcentres = tris.map(t =>
      this.calcCircumcentre(tots[t[0]], tots[t[1]], tots[t[2]])
    );

    const celles: { vertices: { x: number; y: number }[]; idxPunt: number }[] = [];
    for (let i = 0; i < n; i++) {
      const verts: { cc: { x: number; y: number }; angle: number }[] = [];
      for (let j = 0; j < tris.length; j++) {
        if (tris[j][0] === i || tris[j][1] === i || tris[j][2] === i) {
          const cc = circumcentres[j];
          verts.push({ cc, angle: Math.atan2(cc.y - punts[i].y, cc.x - punts[i].x) });
        }
      }
      verts.sort((a, b) => a.angle - b.angle);
      if (verts.length >= 3) {
        celles.push({ vertices: verts.map(v => v.cc), idxPunt: i });
      }
    }

    const arestes: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < tris.length; i++) {
      for (let j = i + 1; j < tris.length; j++) {
        const compartida = this.arestaCompartida(tris[i], tris[j]);
        if (!compartida) continue;
        if (compartida[0] >= n && compartida[1] >= n) continue;
        const retallada = this.retallarLinia(
          circumcentres[i].x, circumcentres[i].y,
          circumcentres[j].x, circumcentres[j].y, w, h,
        );
        if (retallada) arestes.push(retallada);
      }
    }

    return { celles, arestes };
  }

  private puntEnCircumcercle(
    tots: { x: number; y: number }[], tri: number[], p: { x: number; y: number },
  ): boolean {
    const a = tots[tri[0]], b = tots[tri[1]], c = tots[tri[2]];
    const cc = this.calcCircumcentre(a, b, c);
    const r2 = (a.x - cc.x) ** 2 + (a.y - cc.y) ** 2;
    const d2 = (p.x - cc.x) ** 2 + (p.y - cc.y) ** 2;
    return d2 < r2;
  }

  private calcCircumcentre(
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ): { x: number; y: number } {
    const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    if (Math.abs(D) < 1e-10) return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    const a2 = a.x * a.x + a.y * a.y;
    const b2 = b.x * b.x + b.y * b.y;
    const c2 = c.x * c.x + c.y * c.y;
    return {
      x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / D,
      y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / D,
    };
  }

  private triTeAresta(tri: number[], a: number, b: number): boolean {
    for (let i = 0; i < 3; i++) {
      const u = tri[i], v = tri[(i + 1) % 3];
      if ((u === a && v === b) || (u === b && v === a)) return true;
    }
    return false;
  }

  private arestaCompartida(t1: number[], t2: number[]): [number, number] | null {
    for (let i = 0; i < 3; i++) {
      const a = t1[i], b = t1[(i + 1) % 3];
      if (this.triTeAresta(t2, a, b)) return [a, b];
    }
    return null;
  }

  private retallarLinia(
    x1: number, y1: number, x2: number, y2: number, w: number, h: number,
  ): { x1: number; y1: number; x2: number; y2: number } | null {
    const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;
    const code = (x: number, y: number) => {
      let c = INSIDE;
      if (x < 0) c |= LEFT; else if (x > w) c |= RIGHT;
      if (y < 0) c |= TOP; else if (y > h) c |= BOTTOM;
      return c;
    };

    let c1 = code(x1, y1), c2 = code(x2, y2);
    for (let iter = 0; iter < 20; iter++) {
      if (!(c1 | c2)) return { x1, y1, x2, y2 };
      if (c1 & c2) return null;
      const cout = c1 || c2;
      let x = 0, y = 0;
      if (cout & TOP) { x = x1 + (x2 - x1) * -y1 / (y2 - y1); y = 0; }
      else if (cout & BOTTOM) { x = x1 + (x2 - x1) * (h - y1) / (y2 - y1); y = h; }
      else if (cout & RIGHT) { y = y1 + (y2 - y1) * (w - x1) / (x2 - x1); x = w; }
      else { y = y1 + (y2 - y1) * -x1 / (x2 - x1); x = 0; }
      if (cout === c1) { x1 = x; y1 = y; c1 = code(x1, y1); }
      else { x2 = x; y2 = y; c2 = code(x2, y2); }
    }
    return null;
  }
}
