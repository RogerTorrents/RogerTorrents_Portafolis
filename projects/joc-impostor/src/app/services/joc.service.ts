import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Barreja uniforme (Fisher-Yates); `sort` amb un comparador aleatori no ho és. */
function barrejar<T>(elements: readonly T[]): T[] {
  const resultat = [...elements];
  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultat[i], resultat[j]] = [resultat[j], resultat[i]];
  }
  return resultat;
}

export type ModusJoc = 'manual' | 'lliure' | 'ribes';
export type Idioma = 'català' | 'castellà' | 'anglès';
export type Rol = 'jugador' | 'impostor';

export interface ParaulaAmbPista {
  paraula: string;
  pista: string;
}

export interface LotParaules {
  categoria: string;
  pista: string;
  paraules: string[];
  llistat?: ParaulaAmbPista[];
}

export interface ConfiguracioPartida {
  jugadors: string[];
  nombreImpostors: number;
  modus: ModusJoc;
  dificultat: number;
  idioma: Idioma;
  categoria: string;
  mostrarPista: boolean;
  permetCanviarParaula: boolean;
}

export interface JugadorPartida {
  nom: string;
  rol: Rol;
  paraula: string;
  haVist: boolean;
}

export interface EstatPartida {
  jugadors: JugadorPartida[];
  indexParaulaActual: number;
  lotParaules: LotParaules;
  canvisRestants: number;
  jugadorInicial: string | null;
}

@Injectable({ providedIn: 'root' })
export class JocService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/api/paraules`;

  readonly pantalla = signal<1 | 2 | 3 | 4>(1);
  readonly configuracio = signal<ConfiguracioPartida | null>(null);
  readonly estatPartida = signal<EstatPartida | null>(null);
  readonly carregant = signal<boolean>(false);
  readonly errorApi = signal<string | null>(null);
  readonly configAnterior = signal<ConfiguracioPartida | null>(null);

  async iniciarPartida(config: ConfiguracioPartida): Promise<void> {
    this.carregant.set(true);
    this.errorApi.set(null);
    this.configuracio.set(config);

    try {
      const lot = await this.obtindreParaules(config);
      const estatInicial: EstatPartida = {
        jugadors: [],
        indexParaulaActual: 0,
        lotParaules: lot,
        canvisRestants: config.permetCanviarParaula ? 5 : 0,
        jugadorInicial: null,
      };
      this.estatPartida.set(estatInicial);
      this.assignarRols(estatInicial, config);
      this.pantalla.set(2);
    } catch (e) {
      // Es desa la clau de traducció perquè el missatge segueixi l'idioma del Shell
      const clau = (e instanceof Error && e.message === 'ribes-404') ? 'error_ribes' : 'error_servidor';
      this.errorApi.set(clau);
    } finally {
      this.carregant.set(false);
    }
  }

  private async obtindreParaules(config: ConfiguracioPartida): Promise<LotParaules> {
    if (config.modus === 'ribes') {
      const resp = await fetch('assets/data/ribes.json');
      if (!resp.ok) throw new Error('ribes-404');
      const dades = await resp.json() as LotParaules;
      const paraules = barrejar(dades.paraules.filter(p => p.trim().length > 0));
      return { ...dades, paraules };
    }
    if (config.modus === 'lliure') {
      const r = await firstValueFrom(
        this.http.post<{ llistat: ParaulaAmbPista[] }>(this.API_URL, {
          dificultat: config.dificultat,
          idioma: config.idioma,
        })
      );
      return { categoria: 'Lliure', pista: '', paraules: [], llistat: r.llistat };
    }
    return firstValueFrom(
      this.http.post<LotParaules>(this.API_URL, {
        categoria: config.categoria,
        dificultat: config.dificultat,
        idioma: config.idioma,
      })
    );
  }

  obtenirDadesRonda(): { paraula: string; pista: string; categoria: string } {
    const estat = this.estatPartida();
    const config = this.configuracio();
    if (!estat || !config) return { paraula: '', pista: '', categoria: '' };
    const { paraula, pista } = this.obtenirParaulaActivaDe(estat, config);
    const categoria = config.modus === 'lliure' ? pista : estat.lotParaules.categoria;
    return { paraula, pista, categoria };
  }

  private obtenirParaulaActivaDe(estat: EstatPartida, config: ConfiguracioPartida): { paraula: string; pista: string } {
    const { indexParaulaActual: i, lotParaules: lot } = estat;
    if (config.modus === 'lliure' && lot.llistat) {
      const item = lot.llistat[i] ?? lot.llistat[0];
      return { paraula: item.paraula, pista: item.pista };
    }
    return { paraula: lot.paraules[i] ?? lot.paraules[0], pista: lot.pista };
  }

  private assignarRols(estat: EstatPartida, config: ConfiguracioPartida): void {
    const { paraula, pista } = this.obtenirParaulaActivaDe(estat, config);

    // Barreja per determinar qui és impostor, però sense alterar l'ordre de visualització
    const indexosBarrejats = barrejar([...config.jugadors.keys()]);
    const indexosImpostors = new Set(indexosBarrejats.slice(0, config.nombreImpostors));

    // Mantenim l'ordre original de config.jugadors per a la pantalla de repartiment
    const jugadors: JugadorPartida[] = config.jugadors.map((nom, i) => {
      const esImpostor = indexosImpostors.has(i);
      const paraulaJugador = esImpostor
        ? (config.modus === 'lliure' && config.mostrarPista ? pista : 'IMPOSTOR')
        : paraula;
      return { nom, rol: esImpostor ? 'impostor' : 'jugador', paraula: paraulaJugador, haVist: false };
    });

    this.estatPartida.set({ ...estat, jugadors });
  }

  potCanviarParaula(jugador: JugadorPartida): boolean {
    const estat = this.estatPartida();
    const config = this.configuracio();
    if (!estat || !config || !config.permetCanviarParaula) return false;
    if (estat.canvisRestants <= 0 || jugador.rol === 'impostor') return false;
    // Només el primer jugador que mira pot canviar: si fos el primer no-impostor,
    // el segon sabria que el primer era impostor en veure el botó
    return estat.jugadors.every(j => !j.haVist);
  }

  canvisRestantsActuals(): number {
    return this.estatPartida()?.canvisRestants ?? 0;
  }

  canviarParaula(): void {
    const estat = this.estatPartida();
    const config = this.configuracio();
    if (!estat || !config || estat.canvisRestants <= 0) return;

    const mida = config.modus === 'lliure' && estat.lotParaules.llistat
      ? estat.lotParaules.llistat.length
      : estat.lotParaules.paraules.length;

    const nouIndex = Math.min(estat.indexParaulaActual + 1, mida - 1);
    const nouEstat: EstatPartida = { ...estat, indexParaulaActual: nouIndex };
    const { paraula, pista } = this.obtenirParaulaActivaDe(nouEstat, config);

    // Actualitza la paraula de cada jugador mantenint rols i haVist intactes
    const jugadorsActualitzats = estat.jugadors.map(j => ({
      ...j,
      paraula: j.rol === 'impostor'
        ? (config.modus === 'lliure' && config.mostrarPista ? pista : 'IMPOSTOR')
        : paraula,
    }));

    this.estatPartida.set({
      ...nouEstat,
      jugadors: jugadorsActualitzats,
      canvisRestants: estat.canvisRestants - 1,
    });
  }

  marcarHaVist(nom: string): void {
    const estat = this.estatPartida();
    const config = this.configuracio();
    if (!estat || !config) return;

    const jugador = estat.jugadors.find(j => j.nom === nom);
    if (!jugador || jugador.haVist) return;

    const novsJugadors = estat.jugadors.map(j => j.nom === nom ? { ...j, haVist: true } : j);
    const totHanVist = novsJugadors.every(j => j.haVist);
    const jugadorInicial = totHanVist && !estat.jugadorInicial
      ? this.triarJugadorInicial(novsJugadors)
      : estat.jugadorInicial;

    this.estatPartida.set({
      ...estat,
      jugadors: novsJugadors,
      // En tancar el primer popup els canvis s'esgoten
      canvisRestants: 0,
      jugadorInicial,
    });

    if (totHanVist) {
      setTimeout(() => this.pantalla.set(3), 1200);
    }
  }

  private triarJugadorInicial(jugadors: JugadorPartida[]): string {
    const pesTotal = jugadors.reduce((s, j) => s + (j.rol === 'impostor' ? 1 : 2), 0);
    let r = Math.random() * pesTotal;
    for (const j of jugadors) {
      r -= j.rol === 'impostor' ? 1 : 2;
      if (r <= 0) return j.nom;
    }
    return jugadors[jugadors.length - 1].nom;
  }

  revelarFinal(): void {
    this.pantalla.set(4);
  }

  tornarAJugar(): void {
    this.configAnterior.set(this.configuracio());
    this.estatPartida.set(null);
    this.configuracio.set(null);
    this.errorApi.set(null);
    this.pantalla.set(1);
  }
}
