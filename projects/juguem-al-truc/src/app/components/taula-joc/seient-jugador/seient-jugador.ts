import { Component, computed, input } from '@angular/core';
import { nomFitxerPersonatge } from '../../../models/personatge.model';
import { JugadorPublic } from '../../../models/sala.model';
import { PosicioTaula } from '../../../services/seients.util';
import { TraduccioService } from '../../../services/traduccio.service';

export type PoseJugador = 'normal' | 'truco' | 'res' | 'un-1' | 'un-2' | 'un-3';

/** Mà sencera (3 cartes): valor per defecte abans que arribi el primer `estat_joc` de la mà. */
const CARTES_PER_DEFECTE = 3;

@Component({
  selector: 'app-seient-jugador',
  imports: [],
  templateUrl: './seient-jugador.html',
  styleUrl: './seient-jugador.css',
})
export class SeientJugador {
  readonly jugador = input<JugadorPublic | null>(null);
  readonly posicio = input.required<PosicioTaula>();
  readonly esElTorn = input(false);
  readonly ets = input(false);
  readonly cartesRestants = input<number | null>(null);
  readonly connectat = input(true);
  readonly pose = input<PoseJugador>('normal');

  constructor(protected readonly ts: TraduccioService) {}

  /**
   * Cada personatge té una imatge diferent segons les cartes que li queden
   * a la mà (0-3) per cada pose (`normal/Pere2.png`, `truco/Marina1.png`,
   * `un-3/Paula3.png`...) — noms capitalitzats tal com es van afegir a
   * `public/truc/<pose>/`, no en minúscules com la resta d'assets.
   */
  protected readonly rutaImatge = computed(() => {
    const j = this.jugador();
    if (!j) return '';
    const cartes = this.cartesRestants() ?? CARTES_PER_DEFECTE;
    return `/truc/${this.pose()}/${nomFitxerPersonatge(j.personatge)}${cartes}.png`;
  });
}
