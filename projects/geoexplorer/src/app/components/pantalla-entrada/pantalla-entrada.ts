import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';

/**
 * L'animació de la traça es fa amb la Web Animations API (`.animate()`),
 * NO amb `@keyframes` de CSS: l'encapsulació emulada d'Angular renombra la
 * definició `@keyframes` (p. ex. `_ngcontent-xxx_geo-traçar`) però NO
 * reescriu la referència dins la propietat `animation` dels components
 * (que continua dient `geo-traçar`) — l'animació queda declarada però mai
 * s'executa, sense cap error a consola. `.animate()` no depèn de noms de
 * keyframes CSS, així que no pateix aquest problema.
 */
@Component({
  selector: 'app-pantalla-entrada',
  standalone: true,
  templateUrl: './pantalla-entrada.html',
  styleUrl: './pantalla-entrada.css',
})
export class PantallaEntrada implements AfterViewInit {
  protected readonly sessio = inject(SessioService);
  protected readonly ts = inject(TraduccioService);

  @ViewChild('traçaLinia') private readonly traçaLinia?: ElementRef<SVGPathElement>;
  @ViewChild('traçaFita') private readonly traçaFita?: ElementRef<SVGRectElement>;

  ngAfterViewInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.traçaLinia?.nativeElement.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 2400,
      delay: 300,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      fill: 'forwards',
    });

    this.traçaFita?.nativeElement.animate([{ opacity: 0 }, { opacity: 0.95 }], {
      duration: 350,
      delay: 2600,
      easing: 'ease-out',
      fill: 'forwards',
    });
  }
}
