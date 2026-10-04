import { Component, input, output } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';

@Component({
  selector: 'app-overlay-ma11',
  imports: [],
  templateUrl: './overlay-ma11.html',
  styleUrl: './overlay-ma11.css',
})
export class OverlayMa11 {
  readonly pucDecidir = input(false);

  readonly vullJugar = output<void>();
  readonly noVullJugar = output<void>();

  constructor(protected readonly ts: TraduccioService) {}
}
