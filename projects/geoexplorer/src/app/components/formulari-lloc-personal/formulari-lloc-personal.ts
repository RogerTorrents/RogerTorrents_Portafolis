import { Component, inject, signal } from '@angular/core';
import { ContingutPersonalService } from '../../services/contingut-personal.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-formulari-lloc-personal',
  standalone: true,
  templateUrl: './formulari-lloc-personal.html',
  styleUrl: './formulari-lloc-personal.css',
})
export class FormulariLlocPersonal {
  protected readonly contingut = inject(ContingutPersonalService);
  protected readonly ts = inject(TraduccioService);

  protected readonly nom = signal('');
  protected readonly descripcio = signal('');

  onNomInput(event: Event): void {
    this.nom.set((event.target as HTMLInputElement).value);
  }

  onDescripcioInput(event: Event): void {
    this.descripcio.set((event.target as HTMLTextAreaElement).value);
  }

  desar(event: Event): void {
    event.preventDefault();
    if (!this.nom().trim()) return;
    this.contingut.crearLloc(this.nom(), this.descripcio());
    this.nom.set('');
    this.descripcio.set('');
  }

  cancelar(): void {
    this.contingut.cancelarColocacio();
    this.nom.set('');
    this.descripcio.set('');
  }
}
