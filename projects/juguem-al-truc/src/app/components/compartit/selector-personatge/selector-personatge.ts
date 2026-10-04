import { Component, input, model } from '@angular/core';
import { nomFitxerPersonatge, PERSONATGES, Personatge } from '../../../models/personatge.model';
import { TraduccioService } from '../../../services/traduccio.service';

@Component({
  selector: 'app-selector-personatge',
  imports: [],
  templateUrl: './selector-personatge.html',
  styleUrl: './selector-personatge.css',
})
export class SelectorPersonatge {
  readonly ocupats = input<readonly Personatge[]>([]);
  readonly seleccionat = model<Personatge | null>(null);

  protected readonly personatges = PERSONATGES;

  constructor(protected readonly ts: TraduccioService) {}

  protected readonly nomFitxer = nomFitxerPersonatge;

  protected esOcupat(personatge: Personatge): boolean {
    return this.ocupats().includes(personatge);
  }

  protected triar(personatge: Personatge): void {
    if (this.esOcupat(personatge)) return;
    this.seleccionat.set(personatge);
  }
}
