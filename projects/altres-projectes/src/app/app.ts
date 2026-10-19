import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Emprovador } from './components/emprovador/emprovador';
import { TargetaProjecte } from './components/targeta-projecte/targeta-projecte';
import { PROJECTES } from './data/projectes.data';
import { Projecte } from './models/projecte.model';
import { TraduccioService } from './services/traduccio.service';

@Component({
  selector: 'app-root',
  imports: [TargetaProjecte, Emprovador],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly ts = inject(TraduccioService);
  protected readonly projectes = PROJECTES;

  /** Projecte obert a l'emprovador, o `null` si no n'hi ha cap. */
  protected readonly provant = signal<Projecte | null>(null);
}
