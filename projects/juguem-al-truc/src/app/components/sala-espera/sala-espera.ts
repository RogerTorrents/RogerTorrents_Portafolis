import { Component, computed, inject, signal } from '@angular/core';
import { Cadira } from './cadira/cadira';
import { JugadorPublic } from '../../models/sala.model';
import { PosicioTaula, posicioRelativa } from '../../services/seients.util';
import { NavegacioService } from '../../services/navegacio.service';
import { SessioJugadorService } from '../../services/sessio-jugador.service';
import { TraduccioService } from '../../services/traduccio.service';
import { TrucSocketService } from '../../services/truc-socket.service';

/**
 * `navigator.clipboard.writeText` rebutja silenciosament (sense cap error
 * visible, només la promesa fallida) quan aquesta app es mostra dins un
 * `<iframe>` d'un altre origen sense `allow="clipboard-write"` — exactament
 * el cas del Shell (port 4200) incrustant aquesta app (port 4208). Es prova
 * primer l'API moderna i, si falla, es recorre al mètode clàssic amb un
 * `<textarea>` ocult (`execCommand`), que no depèn de cap política de
 * permisos de l'iframe.
 */
async function copiarAlPortapapers(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  }
}

@Component({
  selector: 'app-sala-espera',
  imports: [Cadira],
  templateUrl: './sala-espera.html',
  styleUrl: './sala-espera.css',
})
export class SalaEspera {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
  protected readonly trucSocket = inject(TrucSocketService);
  private readonly sessio = inject(SessioJugadorService);

  protected readonly sala = this.trucSocket.estatSala;
  protected readonly elMeuSeient = this.trucSocket.elMeuSeient;
  protected readonly copiat = signal(false);

  protected readonly perPosicio = computed<Record<PosicioTaula, JugadorPublic | null>>(() => {
    const sala = this.sala();
    const jo = this.elMeuSeient();
    const resultat: Record<PosicioTaula, JugadorPublic | null> = { baix: null, dalt: null, esquerra: null, dreta: null };
    if (!sala || jo === null) return resultat;
    for (let seient = 0; seient < 4; seient++) {
      resultat[posicioRelativa(seient, jo)] = sala.jugadors[seient];
    }
    return resultat;
  });

  protected readonly esHost = computed(() => this.elMeuSeient() === this.sala()?.hostSeient);
  protected readonly salaPlena = computed(() => (this.sala()?.jugadors ?? []).every((j) => j !== null));

  protected async copiarCodi(): Promise<void> {
    const codi = this.sala()?.codi;
    if (!codi || !(await copiarAlPortapapers(codi))) return;
    this.copiat.set(true);
    setTimeout(() => this.copiat.set(false), 1800);
  }

  protected iniciar(): void {
    this.trucSocket.iniciarPartida();
  }

  protected async abandonar(): Promise<void> {
    await this.trucSocket.abandonarPartida();
    this.sessio.abandonar();
  }
}
