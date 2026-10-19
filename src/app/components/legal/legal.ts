import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DATA_ACTUALITZACIO, type PestanyaLegal, TEXTOS_LEGALS } from '../../data/legal.data';
import { TranslationService } from '../../services/translation.service';

/** Finestra "Privacitat i avís legal": textos obligatoris (RGPD/LSSI) en l'idioma del Shell. */
@Component({
  selector: 'app-legal',
  standalone: true,
  templateUrl: './legal.html',
  styleUrl: './legal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Legal {
  protected readonly ts = inject(TranslationService);

  protected readonly pestanyes: readonly PestanyaLegal[] = ['privacitat', 'avis'];
  protected readonly pestanya = signal<PestanyaLegal>('privacitat');
  protected readonly dataActualitzacio = DATA_ACTUALITZACIO;

  protected readonly document = computed(() => TEXTOS_LEGALS[this.ts.idioma()][this.pestanya()]);
}
