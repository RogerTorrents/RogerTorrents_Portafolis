import { Component, computed, effect, inject, signal } from '@angular/core';
import { ComJugar } from './components/com-jugar/com-jugar';
import { CrearPartida } from './components/crear-partida/crear-partida';
import { MenuInicial } from './components/menu-inicial/menu-inicial';
import { PartidaAcabada } from './components/partida-acabada/partida-acabada';
import { SalaEspera } from './components/sala-espera/sala-espera';
import { TaulaJoc } from './components/taula-joc/taula-joc';
import { TransicioPartida } from './components/transicio-partida/transicio-partida';
import { UnirPartida } from './components/unir-partida/unir-partida';
import { NavegacioService } from './services/navegacio.service';
import { SessioJugadorService } from './services/sessio-jugador.service';
import { TraduccioService } from './services/traduccio.service';
import { TrucSocketService } from './services/truc-socket.service';

@Component({
  selector: 'app-root',
  imports: [MenuInicial, CrearPartida, UnirPartida, ComJugar, SalaEspera, TransicioPartida, TaulaJoc, PartidaAcabada],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
  private readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly comprovantSessio = signal(true);

  /** Només avisa de desconnexió a pantalles on ja hi havia una connexió activa (mai a menú/formularis, on encara no s'ha intentat connectar). */
  protected readonly mostrarAvisDesconnexio = computed(() => {
    const pantallesAmbConnexio = ['sala-espera', 'transicio', 'joc', 'acabada'];
    return pantallesAmbConnexio.includes(this.nav.pantalla()) && !this.trucSocket.connectat();
  });

  constructor() {
    void this.intentarReconnectar();

    // La partida comença per a tothom quan arriba aquest senyal del servidor
    // (no en clicar el botó — només el host el clica, però els 4 hi han
    // d'entrar alhora) — passant abans per la transició scroll-driven cap
    // a la taula; `TransicioPartida` ja navega sola a `joc` en acabar-la.
    effect(() => {
      if (this.trucSocket.senyalIniciPartida() > 0) {
        this.nav.anarA('transicio');
      }
    });

    effect(() => {
      if (this.trucSocket.estatJoc()?.guanyadorPartida) {
        this.nav.anarA('acabada');
      }
    });

    // "Tornar a jugar" des de la pantalla de partida acabada: per a
    // TOTHOM (no només qui ho ha clicat) — es neteja `estatJoc` perquè no
    // s'hi quedi penjat el `guanyadorPartida` de la partida ja acabada
    // (l'efecte de sobre el tornaria a disparar cap a 'acabada' si mai es
    // tornés a emetre amb el mateix valor).
    effect(() => {
      if (this.trucSocket.senyalReiniciarPartida() > 0) {
        this.trucSocket.estatJoc.set(null);
        this.nav.anarA('sala-espera');
      }
    });
  }

  private async intentarReconnectar(): Promise<void> {
    const desada = this.sessio.recuperar();
    if (!desada) {
      this.comprovantSessio.set(false);
      return;
    }

    const resposta = await this.trucSocket.reconnectar(desada.codiSala, desada.jugadorToken);
    if (resposta.ok) {
      const jugant = this.trucSocket.estatSala()?.estat === 'jugant';
      this.nav.anarA(jugant ? 'joc' : 'sala-espera');
    } else {
      this.sessio.eliminar();
    }
    this.comprovantSessio.set(false);
  }
}
