import { Component, input } from '@angular/core';
import { nomFitxerPersonatge } from '../../../models/personatge.model';
import { JugadorPublic } from '../../../models/sala.model';
import { PosicioTaula } from '../../../services/seients.util';
import { TraduccioService } from '../../../services/traduccio.service';

@Component({
  selector: 'app-cadira',
  imports: [],
  templateUrl: './cadira.html',
  styleUrl: './cadira.css',
})
export class Cadira {
  readonly jugador = input<JugadorPublic | null>(null);
  readonly posicio = input.required<PosicioTaula>();
  readonly ets = input(false);
  readonly esHost = input(false);

  protected readonly nomFitxer = nomFitxerPersonatge;

  constructor(protected readonly ts: TraduccioService) {}
}
