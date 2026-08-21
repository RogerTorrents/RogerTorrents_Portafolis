import { Component, inject, output, signal } from '@angular/core';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-formulari-pla-des-de-zero',
  standalone: true,
  templateUrl: './formulari-pla-des-de-zero.html',
  styleUrl: './formulari-pla-des-de-zero.css',
})
export class FormulariPlaDesDeZero {
  protected readonly ts = inject(TraduccioService);

  readonly tornar = output<void>();
  readonly continuar = output<{ nom: string; durationSetmanes: number }>();

  protected readonly nom = signal('');
  protected readonly durationSetmanes = signal(8);

  onNomInput(event: Event): void {
    this.nom.set((event.target as HTMLInputElement).value);
  }

  onDuradaInput(event: Event): void {
    this.durationSetmanes.set(Number((event.target as HTMLInputElement).value) || 1);
  }

  enviar(event: Event): void {
    event.preventDefault();
    if (!this.nom().trim() || this.durationSetmanes() < 1) return;
    this.continuar.emit({ nom: this.nom().trim(), durationSetmanes: this.durationSetmanes() });
  }
}
