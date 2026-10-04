import { Component, input, output } from '@angular/core';
import { TipusSenyal } from '../../../models/joc.model';
import { TraduccioService } from '../../../services/traduccio.service';

interface SenyalBoto {
  readonly tipus: TipusSenyal;
  readonly clauTraduccio: string;
}

/** Els 4 botons de senyal són estructuralment idèntics (mateixa mida, mateix comportament) — un sol array evita repetir 4 cops el mateix bloc de plantilla. */
const SENYALS: readonly SenyalBoto[] = [
  { tipus: 'un-1', clauTraduccio: 'senyal_un1' },
  { tipus: 'un-2', clauTraduccio: 'senyal_un2' },
  { tipus: 'un-3', clauTraduccio: 'senyal_un3' },
  { tipus: 'res', clauTraduccio: 'senyal_res' },
];

@Component({
  selector: 'app-barra-accions',
  imports: [],
  templateUrl: './barra-accions.html',
  styleUrl: './barra-accions.css',
})
export class BarraAccions {
  readonly potTirar = input(false);
  readonly potTrucar = input(false);
  readonly potSenyalar = input(false);
  /** Certa durant la decisió de la mà dels 11 pròpia: destaca els senyals (polsen) perquè es facin servir per avisar la parella. */
  readonly destacarSenyals = input(false);

  readonly tirar = output<void>();
  readonly truco = output<void>();
  readonly senyal = output<TipusSenyal>();

  protected readonly senyals = SENYALS;

  constructor(protected readonly ts: TraduccioService) {}
}
