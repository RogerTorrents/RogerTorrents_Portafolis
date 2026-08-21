import { Injectable, computed, signal } from '@angular/core';

interface PeticioConfirmacio {
  readonly missatge: string;
  readonly resoldre: (confirmat: boolean) => void;
}

/**
 * Diàleg de confirmació genèric (Sí/No) per a accions destructives, en
 * comptes del `confirm()` natiu del navegador. `demanar(...)` retorna una
 * `Promise<boolean>` que es resol quan l'usuari prem "Confirmar" o
 * "Cancel·lar" al `ConfirmacioDialeg` muntat a l'arrel de l'app.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacioService {
  private readonly peticio = signal<PeticioConfirmacio | null>(null);

  readonly missatge = computed(() => this.peticio()?.missatge ?? null);

  demanar(missatge: string): Promise<boolean> {
    return new Promise<boolean>((resoldre) => {
      this.peticio.set({ missatge, resoldre });
    });
  }

  confirmar(): void {
    this.peticio()?.resoldre(true);
    this.peticio.set(null);
  }

  cancelar(): void {
    this.peticio()?.resoldre(false);
    this.peticio.set(null);
  }
}
