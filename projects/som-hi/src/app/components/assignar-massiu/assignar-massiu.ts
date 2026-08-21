import { Component, inject, input, output, signal } from '@angular/core';
import { DIES_SETMANA, type DiaSetmana } from '../../models/assignacio.model';
import type { Entrenament } from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-assignar-massiu',
  standalone: true,
  templateUrl: './assignar-massiu.html',
  styleUrl: './assignar-massiu.css',
})
export class AssignarMassiu {
  private readonly assignacionsService = inject(AssignacionsService);
  protected readonly ts = inject(TraduccioService);

  readonly plaId = input.required<string>();
  readonly entrenament = input.required<Entrenament>();

  readonly tancar = output<void>();

  protected readonly diesSetmana = DIES_SETMANA;
  private readonly clauTraduccioPerDia: Record<DiaSetmana, string> = {
    DILLUNS: 'diasetmana_dilluns',
    DIMARTS: 'diasetmana_dimarts',
    DIMECRES: 'diasetmana_dimecres',
    DIJOUS: 'diasetmana_dijous',
    DIVENDRES: 'diasetmana_divendres',
    DISSABTE: 'diasetmana_dissabte',
    DIUMENGE: 'diasetmana_diumenge',
  };
  protected readonly diaSetmana = signal<DiaSetmana>('DILLUNS');
  protected readonly desDe = signal('');
  protected readonly carregant = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resultat = signal<number | null>(null);

  etiquetaDia(dia: DiaSetmana): string {
    return this.ts.t(this.clauTraduccioPerDia[dia]);
  }

  onDiaChange(event: Event): void {
    this.diaSetmana.set((event.target as HTMLSelectElement).value as DiaSetmana);
  }

  onDesDeInput(event: Event): void {
    this.desDe.set((event.target as HTMLInputElement).value);
  }

  crear(event: Event): void {
    event.preventDefault();
    this.carregant.set(true);
    this.error.set(null);
    this.assignacionsService.crearMassiu(
      this.plaId(),
      {
        entrenamentId: this.entrenament().id,
        diaSetmana: this.diaSetmana(),
        ...(this.desDe() ? { desDe: this.desDe() } : {}),
      },
      (creades) => {
        this.carregant.set(false);
        this.resultat.set(creades);
      },
      (missatge) => {
        this.carregant.set(false);
        this.error.set(missatge);
      },
    );
  }
}
