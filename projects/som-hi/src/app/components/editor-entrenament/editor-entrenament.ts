import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import {
  DadesEntrenament,
  ExerciciGym,
  MODALITATS,
  Modalitat,
  TERRENYS_ENTRENAMENT,
  TerrenyEntrenament,
  ZONES_ENTRENAMENT,
  ZonaEntrenament,
} from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { EntrenamentsService } from '../../services/entrenaments.service';
import { TraduccioService } from '../../services/traduccio.service';
import { ExerciciGymFila } from './exercici-gym-fila/exercici-gym-fila';

const EXERCICI_BUIT: ExerciciGym = { nom: '', series: 3, repeticions: 10 };

@Component({
  selector: 'app-editor-entrenament',
  standalone: true,
  imports: [ExerciciGymFila],
  templateUrl: './editor-entrenament.html',
  styleUrl: './editor-entrenament.css',
})
export class EditorEntrenament implements OnInit {
  private readonly entrenamentsService = inject(EntrenamentsService);
  private readonly assignacionsService = inject(AssignacionsService);
  private readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);

  readonly plaId = input.required<string>();
  /** Present si s'edita un entrenament existent; absent si se'n crea un de nou. */
  readonly entrenamentId = input<string | undefined>(undefined);
  /** Present si, en crear-se, l'entrenament s'ha d'assignar de seguida a aquest dia. */
  readonly diaAssignar = input<string | undefined>(undefined);

  readonly tancar = output<void>();
  readonly desat = output<void>();

  protected readonly modalitats = MODALITATS;
  protected readonly zones = ZONES_ENTRENAMENT;
  protected readonly terrenys = TERRENYS_ENTRENAMENT;

  protected readonly enEdicio = computed(() => this.entrenamentId() !== undefined);
  protected readonly carregant = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly titol = signal('');
  protected readonly modalitat = signal<Modalitat>('CORRER');

  // Córrer
  protected readonly zona = signal<ZonaEntrenament>('SUAU');
  protected readonly km = signal(5);
  protected readonly tempsCorrer = signal(30);
  protected readonly polsacionsMaximes = signal<number | null>(null);
  protected readonly terreny = signal<TerrenyEntrenament | null>(null);

  // Bici
  protected readonly kmBici = signal(20);
  protected readonly tempsBici = signal(45);

  // Gym
  protected readonly exercicis = signal<ExerciciGym[]>([{ ...EXERCICI_BUIT }]);

  // Pilates
  protected readonly exerciciPilates = signal('');
  protected readonly linkVideo = signal('');

  // Piscina
  protected readonly distanciaMetres = signal(1000);
  protected readonly tempsPiscina = signal(30);

  // Altre
  protected readonly descripcioAltre = signal('');
  protected readonly tempsAltre = signal<number | null>(null);

  ngOnInit(): void {
    const id = this.entrenamentId();
    if (!id) return;
    const entrenament = this.entrenamentsService.entrenaments().find((e) => e.id === id);
    if (!entrenament) return;

    this.titol.set(entrenament.titol);
    this.modalitat.set(entrenament.modalitat);
    this.emplenarDesDeDades(entrenament.dades);
  }

  onTitolInput(event: Event): void {
    this.titol.set((event.target as HTMLInputElement).value);
  }

  onModalitatChange(event: Event): void {
    this.modalitat.set((event.target as HTMLSelectElement).value as Modalitat);
  }

  onZonaChange(event: Event): void {
    this.zona.set((event.target as HTMLSelectElement).value as ZonaEntrenament);
  }

  onTerrenyChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.terreny.set(valor ? (valor as TerrenyEntrenament) : null);
  }

  protected textDe(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected numeroDe(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  protected numeroOpcionalDe(event: Event): number | null {
    const valor = (event.target as HTMLInputElement).value;
    return valor === '' ? null : Number(valor);
  }

  afegirExercici(): void {
    this.exercicis.update((llista) => [...llista, { ...EXERCICI_BUIT }]);
  }

  eliminarExercici(index: number): void {
    this.exercicis.update((llista) => llista.filter((_, i) => i !== index));
  }

  actualitzarExercici(index: number, canvi: Partial<ExerciciGym>): void {
    this.exercicis.update((llista) => llista.map((ex, i) => (i === index ? { ...ex, ...canvi } : ex)));
  }

  guardar(event: Event): void {
    event.preventDefault();
    if (!this.titol().trim()) return;
    if (this.modalitat() === 'GYM' && this.exercicis().length === 0) return;

    this.carregant.set(true);
    this.error.set(null);
    const payload = { titol: this.titol().trim(), modalitat: this.modalitat(), dades: this.construirDades() };

    if (this.enEdicio()) {
      this.entrenamentsService.actualitzar(
        this.entrenamentId()!,
        payload,
        () => {
          // `assignacionsService.assignacions()` guarda una còpia encastada
          // de l'entrenament a cada assignació (per no fer un join a cada
          // GET) — cal refrescar-la explícitament, si no el dia i la
          // pantalla de detall seguirien mostrant el contingut vell tot i
          // que el backend ja té el nou (bug real trobat i corregit).
          this.assignacionsService.carregarDePla(this.plaId());
          this.carregant.set(false);
          this.desat.emit();
        },
        (missatge) => {
          this.carregant.set(false);
          this.error.set(missatge);
        },
      );
      return;
    }

    this.entrenamentsService.crear(
      this.plaId(),
      payload,
      (entrenament) => {
        const dia = this.diaAssignar();
        if (!dia) {
          this.carregant.set(false);
          this.desat.emit();
          return;
        }
        this.assignacionsService.crear(this.plaId(), { entrenamentId: entrenament.id, data: dia }, () => {
          this.carregant.set(false);
          this.desat.emit();
        });
      },
      (missatge) => {
        this.carregant.set(false);
        this.error.set(missatge);
      },
    );
  }

  async eliminar(): Promise<void> {
    const id = this.entrenamentId();
    if (!id) return;
    const confirmat = await this.confirmacio.demanar(this.ts.t('editor_entrenament_eliminar_confirmacio', [this.titol()]));
    if (!confirmat) return;
    this.entrenamentsService.eliminar(id, () => {
      // Elimina en cascada les seves assignacions al backend — cal
      // refrescar-les aquí també, si no quedarien "fantasma" a la UI.
      this.assignacionsService.carregarDePla(this.plaId());
      this.desat.emit();
    });
  }

  private construirDades(): DadesEntrenament {
    switch (this.modalitat()) {
      case 'CORRER':
        return {
          modalitat: 'CORRER',
          zona: this.zona(),
          km: this.km(),
          tempsMinuts: this.tempsCorrer(),
          ...(this.polsacionsMaximes() ? { polsacionsMaximes: this.polsacionsMaximes()! } : {}),
          ...(this.terreny() ? { terreny: this.terreny()! } : {}),
        };
      case 'BICI':
        return { modalitat: 'BICI', km: this.kmBici(), tempsMinuts: this.tempsBici() };
      case 'GYM':
        return { modalitat: 'GYM', exercicis: this.exercicis() };
      case 'PILATES':
        return {
          modalitat: 'PILATES',
          exercici: this.exerciciPilates(),
          ...(this.linkVideo().trim() ? { linkVideo: this.linkVideo().trim() } : {}),
        };
      case 'PISCINA':
        return { modalitat: 'PISCINA', distanciaMetres: this.distanciaMetres(), tempsMinuts: this.tempsPiscina() };
      case 'ALTRE':
        return {
          modalitat: 'ALTRE',
          descripcio: this.descripcioAltre(),
          ...(this.tempsAltre() ? { tempsMinuts: this.tempsAltre()! } : {}),
        };
    }
  }

  private emplenarDesDeDades(dades: DadesEntrenament): void {
    switch (dades.modalitat) {
      case 'CORRER':
        this.zona.set(dades.zona);
        this.km.set(dades.km);
        this.tempsCorrer.set(dades.tempsMinuts);
        this.polsacionsMaximes.set(dades.polsacionsMaximes ?? null);
        this.terreny.set(dades.terreny ?? null);
        break;
      case 'BICI':
        this.kmBici.set(dades.km);
        this.tempsBici.set(dades.tempsMinuts);
        break;
      case 'GYM':
        this.exercicis.set(dades.exercicis.length > 0 ? [...dades.exercicis] : [{ ...EXERCICI_BUIT }]);
        break;
      case 'PILATES':
        this.exerciciPilates.set(dades.exercici);
        this.linkVideo.set(dades.linkVideo ?? '');
        break;
      case 'PISCINA':
        this.distanciaMetres.set(dades.distanciaMetres);
        this.tempsPiscina.set(dades.tempsMinuts);
        break;
      case 'ALTRE':
        this.descripcioAltre.set(dades.descripcio);
        this.tempsAltre.set(dades.tempsMinuts ?? null);
        break;
    }
  }
}
