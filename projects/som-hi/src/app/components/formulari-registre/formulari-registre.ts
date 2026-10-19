import { Component, inject, signal } from '@angular/core';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-formulari-registre',
  standalone: true,
  templateUrl: './formulari-registre.html',
  styleUrl: '../formulari-entrada.css',
})
export class FormulariRegistre {
  protected readonly sessio = inject(SessioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly nom = signal('');
  protected readonly email = signal('');
  protected readonly contrasenya = signal('');
  protected readonly acceptaPrivacitat = signal(false);

  /** La política de privacitat viu al Shell: l'enllaç només té sentit dins l'iframe. */
  protected readonly dinsShell = window.parent !== window;

  onNomInput(event: Event): void {
    this.nom.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onContrasenyaInput(event: Event): void {
    this.contrasenya.set((event.target as HTMLInputElement).value);
  }

  onPrivacitatChange(event: Event): void {
    this.acceptaPrivacitat.set((event.target as HTMLInputElement).checked);
  }

  /** Demana al Shell que obri la finestra "Privacitat i avís legal". El
   *  missatge no porta cap dada, i el Shell en valida l'origen. */
  obrirPrivacitat(): void {
    window.parent.postMessage({ origen: 'os-app', tipus: 'obrir-legal' }, '*');
  }

  enviar(event: Event): void {
    event.preventDefault();
    if (!this.acceptaPrivacitat()) {
      this.sessio.errorSessio.set(this.ts.t('registre_privacitat_requerida'));
      return;
    }
    this.sessio.registrar(this.nom(), this.email(), this.contrasenya());
  }
}
