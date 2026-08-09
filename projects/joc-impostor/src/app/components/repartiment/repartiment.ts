import { Component, inject, signal, computed } from '@angular/core';
import { JocService, JugadorPartida } from '../../services/joc.service';
import { PopupRol } from '../popup-rol/popup-rol';

@Component({
  selector: 'app-repartiment',
  standalone: true,
  imports: [PopupRol],
  templateUrl: './repartiment.html',
  styleUrl: './repartiment.css',
})
export class Repartiment {
  readonly joc = inject(JocService);

  readonly jugadorActiuNom = signal<string | null>(null);

  // Computed per actualitzar-se automàticament quan canvia la paraula al servei
  readonly jugadorActiu = computed<JugadorPartida | null>(() => {
    const nom = this.jugadorActiuNom();
    if (!nom) return null;
    return this.joc.estatPartida()?.jugadors.find(j => j.nom === nom) ?? null;
  });

  readonly jugadors = computed(() => this.joc.estatPartida()?.jugadors ?? []);
  readonly haVistos = computed(() => this.jugadors().filter(j => j.haVist).length);
  readonly total = computed(() => this.jugadors().length);
  readonly totHanVist = computed(() =>
    this.jugadors().length > 0 && this.jugadors().every(j => j.haVist)
  );
  readonly potCanviarActual = computed(() => {
    const j = this.jugadorActiu();
    return j ? this.joc.potCanviarParaula(j) : false;
  });
  readonly canvisRestantsActuals = computed(() => this.joc.canvisRestantsActuals());

  obrirPopup(jugador: JugadorPartida): void {
    if (!jugador.haVist) {
      this.jugadorActiuNom.set(jugador.nom);
    }
  }

  tancarPopup(): void {
    const jugador = this.jugadorActiu();
    if (jugador) {
      this.joc.marcarHaVist(jugador.nom);
    }
    this.jugadorActiuNom.set(null);
  }

  onCanviarParaula(): void {
    this.joc.canviarParaula();
    // El popup NO es tanca — jugadorActiu s'actualitza sol via computed
  }
}
