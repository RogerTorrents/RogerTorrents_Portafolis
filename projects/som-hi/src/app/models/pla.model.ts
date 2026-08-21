export interface Pla {
  readonly id: string;
  readonly usuariId: string;
  readonly nom: string;
  readonly durationSetmanes: number;
  /** 'YYYY-MM-DD' — sempre tractada com a data local, mai com a instant UTC. */
  readonly dataInici: string;
  readonly plaPredefinitOrigenId: string | null;
  readonly creatEl: string;
  readonly actualitzatEl: string;
}

export interface PlaAmbProgres extends Pla {
  readonly totalAssignacions: number;
  readonly assignacionsCompletades: number;
  readonly percentatgeCompletat: number;
}

export interface CrearPlaPayload {
  readonly plaPredefinitId?: string;
  readonly nom?: string;
  readonly durationSetmanes?: number;
  readonly dataInici: string;
}

export interface ActualitzarPlaPayload {
  readonly nom?: string;
  readonly durationSetmanes?: number;
  readonly dataInici?: string;
}
