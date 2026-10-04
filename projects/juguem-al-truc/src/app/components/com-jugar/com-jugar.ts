import { Component, inject } from '@angular/core';
import { Carta as CartaModel } from '../../models/carta.model';
import { NavegacioService } from '../../services/navegacio.service';
import { TraduccioService } from '../../services/traduccio.service';
import { Carta } from '../taula-joc/carta/carta';

/** Força de cada valor, de més fort a més fluix — mateix ordre que `forcaCarta()` al model. */
const ORDRE_FORCA: readonly number[] = [3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5, 4];

/** Un "punt" del desglossament visual de qui guanya la mà (`avaluarMa()` del motor, traduït a dots). */
type PuntRonda = 'guanyada' | 'empat' | 'decisiva' | 'na';

interface CasGuanyarMa {
  readonly rondes: readonly [PuntRonda, PuntRonda, PuntRonda];
  readonly clau: string;
}

/** Els 5 únics desenllaços possibles d'una mà, derivats literalment d'`avaluarMa()` (joc.engine.ts) — cap cas inventat. */
const CASOS_GUANYAR_MA: readonly CasGuanyarMa[] = [
  { rondes: ['guanyada', 'guanyada', 'na'], clau: 'cj_cas_2a0' },
  { rondes: ['guanyada', 'empat', 'na'], clau: 'cj_cas_1a_empat' },
  { rondes: ['empat', 'guanyada', 'na'], clau: 'cj_cas_empat_2a' },
  { rondes: ['empat', 'empat', 'decisiva'], clau: 'cj_cas_doble_empat' },
  { rondes: ['empat', 'empat', 'empat'], clau: 'cj_cas_triple_empat' },
];

interface SenyalIllustrat {
  readonly tipus: string;
  readonly clauTraduccio: string;
}

/** Les 4 imatges reals de `botons/` (les mateixes que `barra-accions`) — mai icones genèriques. */
const SENYALS_ILLUSTRATS: readonly SenyalIllustrat[] = [
  { tipus: 'un-1', clauTraduccio: 'senyal_un1' },
  { tipus: 'un-2', clauTraduccio: 'senyal_un2' },
  { tipus: 'un-3', clauTraduccio: 'senyal_un3' },
  { tipus: 'res', clauTraduccio: 'senyal_res' },
];

@Component({
  selector: 'app-com-jugar',
  imports: [Carta],
  templateUrl: './com-jugar.html',
  styleUrl: './com-jugar.css',
})
export class ComJugar {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);

  /** Una carta d'oros per cada valor, en ordre de força — referència visual real (no inventada) de la jerarquia. */
  protected readonly cartesForca: readonly CartaModel[] = ORDRE_FORCA.map((valor) => ({
    id: `oros-${valor}`,
    coll: 'oros',
    valor,
  }));

  protected readonly casosGuanyarMa = CASOS_GUANYAR_MA;
  protected readonly senyalsIllustrats = SENYALS_ILLUSTRATS;
  protected readonly numerosRonda = [1, 2, 3] as const;
}
