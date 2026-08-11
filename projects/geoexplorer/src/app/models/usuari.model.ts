/** Usuari autenticat. En producció vindrà de l'API (taula SQL `usuaris`). */
export interface Usuari {
  readonly id: string;
  readonly nom: string;
  readonly email: string;
}
