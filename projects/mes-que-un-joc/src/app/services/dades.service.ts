import { Injectable, computed, inject } from '@angular/core';
import { JUGADORS } from '../data/jugadors.data';
import { TEMPORADES } from '../data/temporades.data';
import { Jugador } from '../models/jugador.model';
import { Temporada } from '../models/temporada.model';
import { EpocaService } from './epoca.service';

/** Exposa el dataset del Barça ja filtrat segons l'època seleccionada. */
@Injectable({ providedIn: 'root' })
export class DadesService {
  private readonly epocaService = inject(EpocaService);

  private readonly anyMinim = computed(
    () => this.epocaService.epocaPerId(this.epocaService.epocaActual()).anyMinim
  );

  readonly temporades = computed<readonly Temporada[]>(() => {
    const anyMinim = this.anyMinim();
    return anyMinim === null ? TEMPORADES : TEMPORADES.filter(t => t.anyInici >= anyMinim);
  });

  readonly jugadors = computed<readonly Jugador[]>(() => {
    const anyMinim = this.anyMinim();
    return anyMinim === null ? JUGADORS : JUGADORS.filter(j => j.anyRetirada >= anyMinim);
  });

  private readonly jugadorsPerId = new Map<string, Jugador>(JUGADORS.map(j => [j.id, j]));

  jugadorPerId(id: string): Jugador | undefined {
    return this.jugadorsPerId.get(id);
  }
}
