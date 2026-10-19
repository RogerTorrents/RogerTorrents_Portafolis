import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Projecte } from '../../models/projecte.model';
import { TraduccioService } from '../../services/traduccio.service';

type Mida = 'escriptori' | 'mobil';

/**
 * Finestra superposada que carrega la web real dins d'un iframe, per
 * provar-la sense sortir del portafolis. Esc o "Tancar" la tanquen.
 */
@Component({
  selector: 'app-emprovador',
  templateUrl: './emprovador.html',
  styleUrl: './emprovador.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'tancar.emit()' },
})
export class Emprovador {
  protected readonly ts = inject(TraduccioService);
  private readonly sanejador = inject(DomSanitizer);

  readonly projecte = input.required<Projecte>();
  readonly tancar = output<void>();

  protected readonly mides: readonly Mida[] = ['escriptori', 'mobil'];
  protected readonly mida = signal<Mida>('escriptori');
  protected readonly carregant = signal(true);

  /** Les URL surten de `PROJECTES` (dades pròpies, no d'usuari), per això es poden marcar com a segures. */
  protected readonly urlSegura = computed<SafeResourceUrl>(() =>
    this.sanejador.bypassSecurityTrustResourceUrl(this.projecte().url),
  );

  constructor() {
    effect(() => {
      this.projecte();
      this.carregant.set(true);
    });
  }
}
