import { Component, computed, inject, input, output } from '@angular/core';
import { TraduccioService } from '../../../services/traduccio.service';
import { VIDES_INICIALS } from '../../../models/joc.model';

@Component({
  selector: 'app-resultat-joc',
  templateUrl: './resultat-joc.html',
  styleUrl: './resultat-joc.css',
})
export class ResultatJoc {
  readonly ts = inject(TraduccioService);

  readonly guanyat = input.required<boolean>();
  readonly estrelles = input.required<number>();

  readonly reintentar = output<void>();
  readonly tornar = output<void>();

  readonly estels = computed(() =>
    Array.from({ length: VIDES_INICIALS }, (_, i) => i < this.estrelles())
  );
}
