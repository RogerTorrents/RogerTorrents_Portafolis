import { Component, input, output } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';

@Component({
  selector: 'app-overlay-truc',
  imports: [],
  templateUrl: './overlay-truc.html',
  styleUrl: './overlay-truc.css',
})
export class OverlayTruc {
  readonly valorProposat = input.required<2 | 3>();
  readonly pucRespondre = input(false);

  readonly vull = output<void>();
  readonly noVull = output<void>();

  constructor(protected readonly ts: TraduccioService) {}
}
