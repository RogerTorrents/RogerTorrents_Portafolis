import { Component, computed, inject } from '@angular/core';
import { TraduccioService } from '../../services/traduccio.service';
import { EpocaService } from '../../services/epoca.service';
import { ProgresService } from '../../services/progres.service';
import { NavegacioService, PantallaId } from '../../services/navegacio.service';
import { EpocaId } from '../../models/epoca.model';
import { JocId } from '../../models/joc.model';

interface DefinicioJoc {
  readonly id: JocId;
  readonly pantalla: PantallaId;
  readonly nomKey: string;
  readonly descKey: string;
  readonly icona: string;
}

const JOCS: readonly DefinicioJoc[] = [
  { id: 'joc1', pantalla: 'joc1', nomKey: 'joc1_nom', descKey: 'joc1_desc', icona: '⏱️' },
  { id: 'joc2', pantalla: 'joc2', nomKey: 'joc2_nom', descKey: 'joc2_desc', icona: '🧩' },
  { id: 'joc3', pantalla: 'joc3', nomKey: 'joc3_nom', descKey: 'joc3_desc', icona: '👕' },
  { id: 'joc4', pantalla: 'joc4', nomKey: 'joc4_nom', descKey: 'joc4_desc', icona: '🏆' },
];

@Component({
  selector: 'app-menu-principal',
  templateUrl: './menu-principal.html',
  styleUrl: './menu-principal.css',
})
export class MenuPrincipal {
  readonly ts = inject(TraduccioService);
  readonly epocaService = inject(EpocaService);
  private readonly progresService = inject(ProgresService);
  private readonly nav = inject(NavegacioService);

  readonly jocs = JOCS;
  readonly epoques = this.epocaService.epoques;

  readonly estrellesEpoca = computed(() =>
    this.progresService.estrellesEpoca(this.epocaService.epocaActual())
  );

  seleccionarEpoca(id: EpocaId): void {
    this.epocaService.seleccionar(id);
  }

  estrellesJoc(jocId: JocId): number {
    return this.progresService.estrellesJoc(this.epocaService.epocaActual(), jocId);
  }

  jugar(joc: DefinicioJoc): void {
    this.nav.anarA(joc.pantalla);
  }
}
