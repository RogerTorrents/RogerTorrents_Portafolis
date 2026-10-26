import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { TraduccioService } from '../../services/traduccio.service';

const NUM_FOTOGRAMES = 16;
const RUTA_BASE = '/truc/elements/transicio_16_fotogrames/fotograma_';
const RETARD_ABANS_DE_LA_PARTIDA_MS = 250;

function rutaFotograma(n: number): string {
  return `${RUTA_BASE}${String(n).padStart(2, '0')}.webp`;
}

/**
 * Transició amb scroll que recorre 16 fotogrames (de la paret al terra vist
 * des de dalt). El primer és el fons de la sala d'espera i ja és a la memòria
 * cau, per això només es precarreguen del 2 al 16.
 */
@Component({
  selector: 'app-transicio-partida',
  imports: [],
  templateUrl: './transicio-partida.html',
  styleUrl: './transicio-partida.css',
})
export class TransicioPartida implements OnDestroy {
  protected readonly ts = inject(TraduccioService);
  private readonly nav = inject(NavegacioService);

  protected readonly fotogramaActual = signal(1);
  protected readonly rutaActual = computed(() => rutaFotograma(this.fotogramaActual()));
  protected readonly progres = signal(0);
  protected readonly mostrarPista = computed(() => this.progres() < 0.03);

  /** Mai es mostra un fotograma encara no arribat: si l'scroll va per davant de la xarxa, es queda al darrer ja disponible fins que el següent carrega. */
  private readonly carregats = new Set<number>([1]);
  private finalitzant = false;

  constructor() {
    for (let n = 2; n <= NUM_FOTOGRAMES; n++) {
      const img = new Image();
      img.onload = () => this.carregats.add(n);
      img.src = rutaFotograma(n);
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const alcadaDisponible = document.documentElement.scrollHeight - window.innerHeight;
    const progres = alcadaDisponible > 0 ? Math.min(1, Math.max(0, window.scrollY / alcadaDisponible)) : 1;
    this.progres.set(progres);

    let objectiu = 1 + Math.round(progres * (NUM_FOTOGRAMES - 1));
    while (objectiu > 1 && !this.carregats.has(objectiu)) objectiu--;
    this.fotogramaActual.set(objectiu);

    if (progres >= 0.995 && !this.finalitzant) {
      this.finalitzant = true;
      setTimeout(() => this.nav.anarA('joc'), RETARD_ABANS_DE_LA_PARTIDA_MS);
    }
  }

  ngOnDestroy(): void {
    window.scrollTo(0, 0);
  }
}
