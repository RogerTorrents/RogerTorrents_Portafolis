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

  onNomInput(event: Event): void {
    this.nom.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onContrasenyaInput(event: Event): void {
    this.contrasenya.set((event.target as HTMLInputElement).value);
  }

  enviar(event: Event): void {
    event.preventDefault();
    this.sessio.registrar(this.nom(), this.email(), this.contrasenya());
  }
}
