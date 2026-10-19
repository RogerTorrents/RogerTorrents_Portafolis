import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Projecte } from '../../models/projecte.model';
import { TraduccioService } from '../../services/traduccio.service';

/**
 * Targeta d'un projecte, pintada amb els colors de la mateixa web:
 * captures a l'esquerra, i a la dreta per a qui és, què fa i els botons.
 */
@Component({
  selector: 'app-targeta-projecte',
  templateUrl: './targeta-projecte.html',
  styleUrl: './targeta-projecte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetaProjecte {
  protected readonly ts = inject(TraduccioService);

  readonly projecte = input.required<Projecte>();
  readonly provar = output<Projecte>();
}
