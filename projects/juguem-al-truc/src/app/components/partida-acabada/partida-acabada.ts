import { Component, computed, inject } from '@angular/core';
import { nomFitxerPersonatge, seientsDeLEquip } from '../../models/personatge.model';
import { nomEquip } from '../../services/seients.util';
import { SessioJugadorService } from '../../services/sessio-jugador.service';
import { TraduccioService } from '../../services/traduccio.service';
import { TrucSocketService } from '../../services/truc-socket.service';

@Component({
  selector: 'app-partida-acabada',
  imports: [],
  templateUrl: './partida-acabada.html',
  styleUrl: './partida-acabada.css',
})
export class PartidaAcabada {
  protected readonly ts = inject(TraduccioService);
  private readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly guanyador = computed(() => this.trucSocket.estatJoc()?.guanyadorPartida ?? null);

  /** Noms reals dels 2 jugadors de l'equip guanyador (no sempre Pere/Paula o Marina/Andreu). */
  protected readonly nomGuanyador = computed(() => {
    const equip = this.guanyador();
    if (!equip) return '';
    return nomEquip(this.trucSocket.estatSala()?.jugadors ?? [], equip);
  });

  /** Retrats dels 2 gegants guanyadors (amb el pernil), en ordre de seient — `public/truc/guanyador/<Personatge>.png`. */
  protected readonly retratsGuanyadors = computed<readonly string[]>(() => {
    const equip = this.guanyador();
    if (!equip) return [];
    const jugadors = this.trucSocket.estatSala()?.jugadors ?? [];
    return seientsDeLEquip(equip)
      .map((seient) => jugadors[seient]?.personatge)
      .filter((personatge) => !!personatge)
      .map((personatge) => `/truc/guanyador/${nomFitxerPersonatge(personatge)}.png`);
  });

  /** Torna tothom a la sala d'espera (mateixos seients, mateix codi) — la navegació real la fa `App` en rebre `partida_reiniciada`. */
  protected tornarAJugar(): void {
    this.trucSocket.tornarAJugar();
  }

  protected async tornarAlMenu(): Promise<void> {
    await this.trucSocket.abandonarPartida();
    this.sessio.abandonar();
  }
}
