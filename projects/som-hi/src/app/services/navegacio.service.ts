import { Injectable, signal } from '@angular/core';

export type VistaApp = 'llista-plans' | 'crear-pla' | 'detall-pla';

/**
 * Navegació dins la zona autenticada de l'app — sense router (mateix patró
 * que la resta del monorepo, `SessioService.pantalla` per a les pantalles
 * d'accés). Un sol signal d'estat perquè `App` decideixi què muntar.
 */
@Injectable({ providedIn: 'root' })
export class NavegacioService {
  readonly vista = signal<VistaApp>('llista-plans');
  readonly plaObertId = signal<string | null>(null);

  anarALlistaPlans(): void {
    this.plaObertId.set(null);
    this.vista.set('llista-plans');
  }

  anarACrearPla(): void {
    this.vista.set('crear-pla');
  }

  obrirPla(id: string): void {
    this.plaObertId.set(id);
    this.vista.set('detall-pla');
  }
}
