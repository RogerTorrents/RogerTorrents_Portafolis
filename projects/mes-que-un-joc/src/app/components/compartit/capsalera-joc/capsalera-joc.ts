import { Component, inject, input, output } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { BarraVides } from '../barra-vides/barra-vides';

@Component({
  selector: 'app-capsalera-joc',
  imports: [BarraVides],
  templateUrl: './capsalera-joc.html',
  styleUrl: './capsalera-joc.css',
})
export class CapsaleraJoc {
  readonly ts = inject(TraduccioService);

  readonly titol = input.required<string>();
  readonly vides = input.required<number>();
  readonly rondaActual = input.required<number>();
  readonly totalRondes = input.required<number>();

  readonly tornar = output<void>();
}
