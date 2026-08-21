import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import type { Entrenament } from '../../models/entrenament.model';
import { AssignacionsService } from '../../services/assignacions.service';
import { EntrenamentsService } from '../../services/entrenaments.service';
import { NavegacioService } from '../../services/navegacio.service';
import { PlansService } from '../../services/plans.service';
import { TraduccioService } from '../../services/traduccio.service';
import { AssignarMassiu } from '../assignar-massiu/assignar-massiu';
import { CalendariPla } from '../calendari-pla/calendari-pla';
import { CapceleraPla } from '../capcalera-pla/capcalera-pla';
import { DetallDia } from '../detall-dia/detall-dia';
import { EditorEntrenament } from '../editor-entrenament/editor-entrenament';
import { SelectorEntrenamentExistent } from '../selector-entrenament-existent/selector-entrenament-existent';
import { VeureEntrenament } from '../veure-entrenament/veure-entrenament';

type Panell =
  | { readonly tipus: 'cap' }
  | { readonly tipus: 'dia'; readonly data: string }
  | { readonly tipus: 'veure'; readonly assignacioId: string }
  | { readonly tipus: 'selector'; readonly data: string }
  | { readonly tipus: 'editor'; readonly entrenamentId?: string; readonly diaAssignar?: string }
  | { readonly tipus: 'massiu'; readonly entrenament: Entrenament };

/**
 * Un sol panell lateral visible cada cop. Tancar qualsevol panell que NO
 * sigui el de dia hi torna (el dia és la "base" dels panells d'edició);
 * tancar el de dia torna al calendari.
 */
@Component({
  selector: 'app-detall-pla',
  standalone: true,
  imports: [
    CapceleraPla,
    CalendariPla,
    DetallDia,
    VeureEntrenament,
    SelectorEntrenamentExistent,
    EditorEntrenament,
    AssignarMassiu,
  ],
  templateUrl: './detall-pla.html',
  styleUrl: './detall-pla.css',
})
export class DetallPla implements OnInit {
  protected readonly plans = inject(PlansService);
  protected readonly assignacionsService = inject(AssignacionsService);
  protected readonly ts = inject(TraduccioService);
  private readonly entrenamentsService = inject(EntrenamentsService);
  private readonly nav = inject(NavegacioService);

  readonly plaId = input.required<string>();

  protected readonly panell = signal<Panell>({ tipus: 'cap' });
  private readonly diaContext = signal<string | null>(null);

  constructor() {
    // Reflecteix a la barra de progrés qualsevol canvi a les assignacions
    // (marcar fet, crear, eliminar, massiu) sense que cada acció hagi de
    // saber explícitament "ara cal refrescar el pla".
    effect(() => {
      this.assignacionsService.assignacions();
      this.plans.carregarPla(this.plaId());
    });
  }

  ngOnInit(): void {
    this.entrenamentsService.carregarDePla(this.plaId());
    this.assignacionsService.carregarDePla(this.plaId());
  }

  obrirDia(data: string): void {
    this.diaContext.set(data);
    this.panell.set({ tipus: 'dia', data });
  }

  obrirVeure(assignacioId: string): void {
    this.panell.set({ tipus: 'veure', assignacioId });
  }

  tancarPanell(): void {
    this.diaContext.set(null);
    this.panell.set({ tipus: 'cap' });
  }

  private tornarADia(): void {
    const data = this.diaContext();
    if (data) this.panell.set({ tipus: 'dia', data });
    else this.tancarPanell();
  }

  obrirSelector(): void {
    const data = this.diaContext();
    if (data) this.panell.set({ tipus: 'selector', data });
  }

  obrirEditorNou(): void {
    this.panell.set({ tipus: 'editor', diaAssignar: this.diaContext() ?? undefined });
  }

  obrirEditorExistent(entrenamentId: string): void {
    this.panell.set({ tipus: 'editor', entrenamentId });
  }

  obrirMassiu(entrenament: Entrenament): void {
    this.panell.set({ tipus: 'massiu', entrenament });
  }

  onPanellTancat(): void {
    this.tornarADia();
  }

  onEntrenamentDesat(): void {
    this.tornarADia();
  }

  onEntrenamentAfegit(): void {
    this.tornarADia();
  }

  eliminarPla(): void {
    this.plans.eliminar(this.plaId(), () => this.nav.anarALlistaPlans());
  }

  tornarALlista(): void {
    this.nav.anarALlistaPlans();
  }
}
