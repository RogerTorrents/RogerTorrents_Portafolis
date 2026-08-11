import { Injectable, signal } from '@angular/core';
import { EPOQUES, Epoca, EpocaId } from '../models/epoca.model';

@Injectable({ providedIn: 'root' })
export class EpocaService {
  readonly epoques: readonly Epoca[] = EPOQUES;
  readonly epocaActual = signal<EpocaId>('sempre');

  seleccionar(id: EpocaId): void {
    this.epocaActual.set(id);
  }

  epocaPerId(id: EpocaId): Epoca {
    return this.epoques.find(e => e.id === id) ?? this.epoques[0];
  }
}
