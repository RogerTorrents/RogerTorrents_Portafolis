import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import {
  EXERCICIS_PER_GRUP,
  GRUPS_MUSCULARS,
  GrupMuscular,
  trobarExerciciPerNom,
  type ExerciciCatalog,
} from '../../../data/exercicis-gym.data';
import type { ExerciciGym } from '../../../models/entrenament.model';
import { TraduccioService } from '../../../services/traduccio.service';

/**
 * Una fila d'exercici de gym: dropdown de part del cos → llista visual
 * (amb foto) dels exercicis d'aquell múscul, o un camp de text lliure si
 * el grup és "Altre". Un cop triat, es col·lapsa a un resum amb foto +
 * nom + "Canviar". El grup muscular NOMÉS és estat local de UI — mai es
 * persisteix (`ExerciciGym` només guarda `nom`); en reobrir un exercici
 * per editar-lo, `trobarExerciciPerNom` reconstrueix quin grup/foto li
 * pertoquen buscant el nom dins de tot el catàleg.
 *
 * `estatLocal` (via `linkedSignal`, sembrat des de l'input `exercici` però
 * després mutat només localment) és la font de veritat mentre s'edita —
 * NO `exercici()` directament. Bug real trobat i corregit: si cada canvi
 * (triar exercici, després escriure sèries) llegia `exercici()` com a base
 * per fer el merge, dos canvis seguits massa ràpids (abans que el pare
 * confirmés el primer, fent tornar avall el nou valor per l'input) feien
 * que el segon canvi es basés en dades velles i esborrés el primer —
 * p. ex. triar "Sentadilla" i tot seguit escriure "4" a sèries acabava
 * enviant `nom: ''` al backend. Amb `estatLocal` cada canvi es basa sempre
 * en l'últim valor conegut localment, sense dependre de cap volta d'anada
 * i tornada.
 */
@Component({
  selector: 'app-exercici-gym-fila',
  standalone: true,
  templateUrl: './exercici-gym-fila.html',
  styleUrl: './exercici-gym-fila.css',
})
export class ExerciciGymFila {
  protected readonly ts = inject(TraduccioService);

  readonly exercici = input.required<ExerciciGym>();
  readonly numero = input.required<number>();

  readonly canvi = output<ExerciciGym>();
  readonly eliminar = output<void>();

  protected readonly grupsMusculars = GRUPS_MUSCULARS;

  protected readonly estatLocal = linkedSignal<ExerciciGym>(() => this.exercici());

  private readonly grupManual = signal<GrupMuscular | null>(null);
  private readonly forcarSelectorObert = signal(false);
  private readonly imatgesTrencades = signal<ReadonlySet<string>>(new Set());

  protected readonly teNomTriat = computed(() => this.estatLocal().nom.trim().length > 0);

  protected readonly grupActual = computed<GrupMuscular | null>(() => {
    if (this.grupManual()) return this.grupManual();
    const trobat = trobarExerciciPerNom(this.estatLocal().nom);
    if (trobat) return trobat.grup;
    return this.teNomTriat() ? 'ALTRE' : null;
  });

  protected readonly mostrantSelector = computed(
    () => this.grupActual() !== 'ALTRE' && (!this.teNomTriat() || this.forcarSelectorObert()),
  );

  protected readonly exercicisDelGrup = computed<readonly ExerciciCatalog[]>(() => {
    const grup = this.grupActual();
    return grup && grup !== 'ALTRE' ? EXERCICIS_PER_GRUP[grup] : [];
  });

  protected readonly fotoTriada = computed<ExerciciCatalog | null>(() => {
    const trobat = trobarExerciciPerNom(this.estatLocal().nom);
    return trobat?.exercici ?? null;
  });

  onGrupChange(event: Event): void {
    this.grupManual.set((event.target as HTMLSelectElement).value as GrupMuscular);
    this.forcarSelectorObert.set(true);
  }

  triarExercici(catalog: ExerciciCatalog): void {
    this.forcarSelectorObert.set(false);
    this.emetreCanvi({ nom: catalog.nom });
  }

  reobrirSelector(): void {
    this.forcarSelectorObert.set(true);
  }

  onNomLliureInput(event: Event): void {
    this.emetreCanvi({ nom: (event.target as HTMLInputElement).value });
  }

  onSeriesInput(event: Event): void {
    this.emetreCanvi({ series: Number((event.target as HTMLInputElement).value) || 0 });
  }

  onRepeticionsInput(event: Event): void {
    this.emetreCanvi({ repeticions: Number((event.target as HTMLInputElement).value) || 0 });
  }

  onPesInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.emetreCanvi({ pesQuilos: valor === '' ? undefined : Number(valor) });
  }

  imatgeTrencada(imatge: string): boolean {
    return this.imatgesTrencades().has(imatge);
  }

  onErrorImatge(imatge: string): void {
    this.imatgesTrencades.update((s) => new Set(s).add(imatge));
  }

  private emetreCanvi(canvi: Partial<ExerciciGym>): void {
    const actualitzat = { ...this.estatLocal(), ...canvi };
    this.estatLocal.set(actualitzat);
    this.canvi.emit(actualitzat);
  }
}
