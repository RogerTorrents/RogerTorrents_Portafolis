import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectorPersonatge } from '../compartit/selector-personatge/selector-personatge';
import { JugadorPublic } from '../../models/sala.model';
import { Personatge } from '../../models/personatge.model';
import { NavegacioService } from '../../services/navegacio.service';
import { SessioJugadorService } from '../../services/sessio-jugador.service';
import { TraduccioService } from '../../services/traduccio.service';
import { TrucSocketService } from '../../services/truc-socket.service';

const LLARGADA_CODI_CONSULTA = 4;
const RETARD_CONSULTA_MS = 350;

@Component({
  selector: 'app-unir-partida',
  imports: [FormsModule, SelectorPersonatge],
  templateUrl: './unir-partida.html',
  styleUrl: './unir-partida.css',
})
export class UnirPartida {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
  private readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly codi = signal('');
  protected readonly nom = signal('');
  protected readonly personatge = signal<Personatge | null>(null);
  protected readonly enviant = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly ocupats = signal<readonly Personatge[]>([]);

  private cronometreConsulta: ReturnType<typeof setTimeout> | undefined;

  protected onCodiChange(valor: string): void {
    const normalitzat = valor.toUpperCase();
    this.codi.set(normalitzat);
    clearTimeout(this.cronometreConsulta);

    if (normalitzat.trim().length < LLARGADA_CODI_CONSULTA) {
      this.ocupats.set([]);
      return;
    }
    this.cronometreConsulta = setTimeout(() => void this.consultarOcupacio(), RETARD_CONSULTA_MS);
  }

  private async consultarOcupacio(): Promise<void> {
    const resposta = await this.trucSocket.consultarSala(this.codi().trim());
    this.ocupats.set(
      resposta.ok
        ? resposta.sala.jugadors.filter((j): j is JugadorPublic => j !== null).map((j) => j.personatge)
        : [],
    );
  }

  protected async unir(): Promise<void> {
    const codi = this.codi().trim();
    const nom = this.nom().trim();
    const personatge = this.personatge();

    if (!codi) {
      this.error.set(this.ts.t('error_falta_codi'));
      return;
    }
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
    const resposta = await this.trucSocket.unirSala(codi, nom, personatge);
    this.enviant.set(false);

    if (resposta.ok) {
      this.sessio.desar(resposta.codiSala, resposta.jugadorToken);
      this.nav.anarA('sala-espera');
    } else {
      this.error.set(resposta.missatge);
    }
  }
}
