import { Component, inject, signal, computed, linkedSignal } from '@angular/core';
import { JocService, ConfiguracioPartida, ModusJoc, Idioma } from '../../services/joc.service';
import { TraduccioService, IdiomaUi } from '../../services/traduccio.service';

const IDIOMA_PARAULES: Record<IdiomaUi, Idioma> = { ca: 'català', es: 'castellà', en: 'anglès' };

@Component({
  selector: 'app-configuracio',
  standalone: true,
  templateUrl: './configuracio.html',
  styleUrl: './configuracio.css',
})
export class Configuracio {
  readonly joc = inject(JocService);
  readonly ts = inject(TraduccioService);

  readonly jugadors = signal<string[]>(['', '', '']);
  readonly nombreImpostors = signal(1);
  readonly modus = signal<ModusJoc>('lliure');
  readonly dificultat = signal(5);
  // Per defecte segueix l'idioma del Shell; l'usuari el pot canviar igualment
  readonly idioma = linkedSignal<Idioma>(() => IDIOMA_PARAULES[this.ts.idioma()]);
  // Els avisos de camps buits només es mostren després d'intentar començar
  readonly intentatIniciar = signal(false);
  readonly categoria = signal('');
  readonly mostrarPista = signal(true);
  readonly permetCanviarParaula = signal(true);

  readonly maxImpostors = computed(() =>
    Math.floor((this.jugadors().length - 1) / 2)
  );

  readonly nomsValids = computed(() => {
    const j = this.jugadors();
    return j.length >= 3 && j.every(n => n.trim().length > 0);
  });

  readonly validacioImpostors = computed(() => {
    const n = this.nombreImpostors();
    return n >= 1 && n <= this.maxImpostors();
  });

  readonly categoriaValida = computed(() =>
    this.modus() !== 'manual' || this.categoria().trim().length > 0
  );

  readonly potIniciar = computed(() =>
    this.nomsValids() &&
    this.validacioImpostors() &&
    this.categoriaValida() &&
    !this.joc.carregant()
  );

  /** Llista llegible dels camps que falten per poder començar. */
  readonly campsQueFalten = computed<string[]>(() => {
    const falten: string[] = [];
    const buits = this.jugadors()
      .map((n, i) => (n.trim().length === 0 ? i + 1 : 0))
      .filter(i => i > 0);
    if (buits.length === 1) {
      falten.push(this.ts.t('falta_nom_jugador', [buits[0]]));
    } else if (buits.length > 1) {
      falten.push(this.ts.t('falta_noms_jugadors', [buits.join(', ')]));
    }
    if (!this.validacioImpostors()) falten.push(this.ts.t('falta_impostors'));
    if (!this.categoriaValida()) falten.push(this.ts.t('falta_categoria'));
    return falten;
  });

  nomBuit(i: number): boolean {
    return this.intentatIniciar() && this.jugadors()[i].trim().length === 0;
  }

  constructor() {
    const ant = this.joc.configAnterior();
    if (ant) {
      this.jugadors.set([...ant.jugadors]);
      this.nombreImpostors.set(ant.nombreImpostors);
      this.modus.set(ant.modus);
      this.dificultat.set(ant.dificultat);
      this.idioma.set(ant.idioma);
      this.categoria.set(ant.categoria);
      this.mostrarPista.set(ant.mostrarPista);
      this.permetCanviarParaula.set(ant.permetCanviarParaula);
    }
  }

  afegirJugador(): void {
    if (this.jugadors().length < 20) {
      this.jugadors.update(j => [...j, '']);
    }
  }

  eliminarJugador(i: number): void {
    const novaLlargada = this.jugadors().length - 1;
    if (novaLlargada < 3) return;
    this.jugadors.update(j => j.filter((_, idx) => idx !== i));
    const maxNou = Math.floor((novaLlargada - 1) / 2);
    if (this.nombreImpostors() > maxNou) {
      this.nombreImpostors.set(Math.max(1, maxNou));
    }
  }

  actualitzarNom(i: number, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.jugadors.update(j => j.map((n, idx) => idx === i ? valor : n));
  }

  decrementarImpostors(): void {
    if (this.nombreImpostors() > 1) this.nombreImpostors.update(n => n - 1);
  }

  incrementarImpostors(): void {
    if (this.nombreImpostors() < this.maxImpostors()) {
      this.nombreImpostors.update(n => n + 1);
    }
  }

  setModus(m: ModusJoc): void {
    this.modus.set(m);
  }

  async comenarJoc(): Promise<void> {
    if (this.joc.carregant()) return;
    this.intentatIniciar.set(true);
    if (!this.potIniciar()) return;
    const config: ConfiguracioPartida = {
      jugadors: this.jugadors().map(n => n.trim()),
      nombreImpostors: this.nombreImpostors(),
      modus: this.modus(),
      dificultat: this.dificultat(),
      idioma: this.idioma(),
      categoria: this.categoria().trim(),
      mostrarPista: this.mostrarPista(),
      permetCanviarParaula: this.permetCanviarParaula(),
    };
    await this.joc.iniciarPartida(config);
  }
}
