import { Component, inject, signal } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService, type Idioma } from '../../services/traduccio.service';

@Component({
  selector: 'app-capcalera',
  standalone: true,
  templateUrl: './capcalera.html',
  styleUrl: './capcalera.css',
})
export class Capcalera {
  protected readonly sessio = inject(SessioService);
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly menuUsuariObert = signal(false);
  protected readonly idiomes: readonly Idioma[] = ['ca', 'es', 'en'];

  alternarMenuUsuari(): void {
    this.menuUsuariObert.update((v) => !v);
  }

  canviarIdioma(idioma: Idioma): void {
    this.ts.establirIdioma(idioma);
  }

  tancarSessio(): void {
    this.menuUsuariObert.set(false);
    this.sessio.tancarSessio();
  }
}
