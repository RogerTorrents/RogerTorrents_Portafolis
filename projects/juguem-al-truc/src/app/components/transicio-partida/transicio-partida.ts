import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { TraduccioService } from '../../services/traduccio.service';

const NUM_FOTOGRAMES = 16;
const RUTA_BASE = '/truc/elements/transicio_16_fotogrames/fotograma_';
const RETARD_ABANS_DE_LA_PARTIDA_MS = 250;

function rutaFotograma(n: number): string {
  return `${RUTA_BASE}${String(n).padStart(2, '0')}.jpg`;
}

/**
 * Transició "efecte Apple": en fer scroll, es recorren els 16 fotogrames
 * reals (paret → terra vist zenitalment, mateixa seqüència de càmera que
 * abans animava `intro-animacio` amb un crossfade CSS, ara amb fotografia
 * real). El fotograma 1 ja viu a la memòria cau del navegador (és el fons
 * estàtic de `sala-espera`, la pantalla anterior) i el 16 és el fons de la
 * taula de joc — per això aquesta pantalla només n'ha de precarregar 2..16.
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
