import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectorPersonatge } from '../compartit/selector-personatge/selector-personatge';
import { Personatge } from '../../models/personatge.model';
import { ModeSala } from '../../models/sala.model';
import { NavegacioService } from '../../services/navegacio.service';
import { SessioJugadorService } from '../../services/sessio-jugador.service';
import { TraduccioService } from '../../services/traduccio.service';
import { TrucSocketService } from '../../services/truc-socket.service';

@Component({
  selector: 'app-crear-partida',
  imports: [FormsModule, SelectorPersonatge],
  templateUrl: './crear-partida.html',
  styleUrl: './crear-partida.css',
})
export class CrearPartida {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
  private readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly modes: readonly ModeSala[] = ['normal', 'solo', 'parelles'];
  protected readonly mode = signal<ModeSala>('normal');
  protected readonly nom = signal('');
  protected readonly personatge = signal<Personatge | null>(null);
  protected readonly enviant = signal(false);
  protected readonly error = signal<string | null>(null);

  protected triarMode(mode: ModeSala): void {
    this.mode.set(mode);
  }

  protected async crear(): Promise<void> {
    const nom = this.nom().trim();
    const personatge = this.personatge();

    if (!nom) {
      this.error.set(this.ts.t('error_falta_nom'));
      return;
    }
    if (!personatge) {
      this.error.set(this.ts.t('error_falta_personatge'));
      return;
    }

    this.error.set(null);
    this.enviant.set(true);
    const resposta = await this.trucSocket.crearSala(nom, personatge, this.mode());
    this.enviant.set(false);

    if (resposta.ok) {
      this.sessio.desar(resposta.codiSala, resposta.jugadorToken);
      this.nav.anarA('sala-espera');
    } else {
      this.error.set(resposta.missatge);
    }
  }
}
