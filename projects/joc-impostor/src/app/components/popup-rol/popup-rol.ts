import { Component, input, output, signal, computed } from '@angular/core';
import { JugadorPartida } from '../../services/joc.service';

@Component({
  selector: 'app-popup-rol',
  standalone: true,
  templateUrl: './popup-rol.html',
  styleUrl: './popup-rol.css',
})
export class PopupRol {
  readonly jugador = input.required<JugadorPartida>();
  readonly potCanviar = input<boolean>(false);
  readonly canvisRestants = input<number>(0);
  readonly tancar = output<void>();
  readonly canviarParaulaClick = output<void>();

  readonly revelat = signal(false);

  readonly esImpostorPur = computed(() =>
    this.jugador().rol === 'impostor' && this.jugador().paraula === 'IMPOSTOR'
  );

  readonly esImpostorAmbPista = computed(() =>
    this.jugador().rol === 'impostor' && this.jugador().paraula !== 'IMPOSTOR'
  );

  readonly classeParaula = computed(() => {
    if (this.esImpostorPur()) return 'impostor';
    if (this.esImpostorAmbPista()) return 'pista';
    return 'jugador';
  });

  readonly etiquetaParaula = computed(() => {
    if (this.esImpostorPur()) return '';
    if (this.esImpostorAmbPista()) return 'La teva pista:';
    return 'La teva paraula:';
  });

  revelar(): void {
    this.revelat.set(true);
  }

  onTancar(): void {
    this.tancar.emit();
  }

  onCanviar(): void {
    this.canviarParaulaClick.emit();
  }
}
