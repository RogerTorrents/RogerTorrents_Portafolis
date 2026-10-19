import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';

/** Diàleg per eliminar el compte (dret de supressió): demana la contrasenya abans d'esborrar-ho tot. */
@Component({
  selector: 'app-eliminar-compte-dialeg',
  standalone: true,
  templateUrl: './eliminar-compte-dialeg.html',
  styleUrls: ['../confirmacio-dialeg/confirmacio-dialeg.css', '../formulari-entrada.css', './eliminar-compte-dialeg.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EliminarCompteDialeg {
  protected readonly sessio = inject(SessioService);
  protected readonly ts = inject(TraduccioService);

  protected readonly contrasenya = signal('');

  onContrasenyaInput(event: Event): void {
    this.contrasenya.set((event.target as HTMLInputElement).value);
  }

  enviar(event: Event): void {
    event.preventDefault();
    this.sessio.eliminarCompte(this.contrasenya());
  }

  cancelar(): void {
    this.contrasenya.set('');
    this.sessio.tancarDialegEliminarCompte();
  }
}
