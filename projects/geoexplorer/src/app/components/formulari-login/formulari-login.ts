import { Component, inject, signal } from '@angular/core';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-formulari-login',
  standalone: true,
  templateUrl: './formulari-login.html',
  styleUrl: '../formulari-entrada.css',
})
export class FormulariLogin {
  protected readonly sessio = inject(SessioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly email = signal('');
  protected readonly contrasenya = signal('');

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onContrasenyaInput(event: Event): void {
    this.contrasenya.set((event.target as HTMLInputElement).value);
  }

  enviar(event: Event): void {
    event.preventDefault();
    this.sessio.iniciarSessio(this.email(), this.contrasenya());
  }
}
