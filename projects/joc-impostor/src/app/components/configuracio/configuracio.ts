import { Component, inject, signal, computed } from '@angular/core';
import { JocService, ConfiguracioPartida, ModusJoc, Idioma } from '../../services/joc.service';

@Component({
  selector: 'app-configuracio',
  standalone: true,
  templateUrl: './configuracio.html',
  styleUrl: './configuracio.css',
})
export class Configuracio {
  readonly joc = inject(JocService);

  readonly jugadors = signal<string[]>(['', '', '']);
  readonly nombreImpostors = signal(1);
  readonly modus = signal<ModusJoc>('manual');
  readonly dificultat = signal(5);
  readonly idioma = signal<Idioma>('català');
  readonly categoria = signal('');
  readonly mostrarPista = signal(true);
  readonly permetCanviarParaula = signal(true);

  readonly maxImpostors = computed(() =>
    Math.floor((this.jugadors().length - 1) / 2)
  );

  readonly nomsValids = computed(() => {
    const j = this.jugadors();
    return j.length >= 2 && j.every(n => n.trim().length > 0);
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
    if (novaLlargada < 2) return;
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
