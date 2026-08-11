import { Component, inject, signal } from '@angular/core';
import { ContingutPersonalService } from '../../services/contingut-personal.service';
import { TraduccioService } from '../../services/traduccio.service';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { COLORS_CATEGORIA_DISPONIBLES, ICONES_CATEGORIA_DISPONIBLES } from '../../models/categoria-personal.model';
import type { CategoriaPersonal } from '../../models/categoria-personal.model';
import type { LlocPersonal } from '../../models/lloc-personal.model';

@Component({
  selector: 'app-panell-categories-personals',
  standalone: true,
  templateUrl: './panell-categories-personals.html',
  styleUrl: './panell-categories-personals.css',
})
export class PanellCategoriesPersonals {
  protected readonly contingut = inject(ContingutPersonalService);
  protected readonly ts = inject(TraduccioService);
  protected readonly confirmacio = inject(ConfirmacioService);

  protected readonly colors = COLORS_CATEGORIA_DISPONIBLES;
  protected readonly icones = ICONES_CATEGORIA_DISPONIBLES;

  protected readonly mostrantFormulari = signal(false);
  protected readonly nomCategoria = signal('');
  protected readonly colorSeleccionat = signal(this.colors[0]);
  protected readonly iconaSeleccionada = signal(this.icones[0]);

  protected llocsDe(categoriaId: string): LlocPersonal[] {
    return this.contingut.llocs().filter(l => l.categoriaId === categoriaId);
  }

  protected trackLloc(_index: number, lloc: LlocPersonal): string {
    return lloc.id;
  }

  async demanarEliminarCategoria(categoria: CategoriaPersonal): Promise<void> {
    const confirmat = await this.confirmacio.demanar(this.ts.t('confirmacio_eliminar_categoria', [categoria.nom]));
    if (confirmat) this.contingut.eliminarCategoria(categoria.id);
  }

  async demanarEliminarLloc(lloc: LlocPersonal): Promise<void> {
    const confirmat = await this.confirmacio.demanar(this.ts.t('confirmacio_eliminar_lloc', [lloc.nom]));
    if (confirmat) this.contingut.eliminarLloc(lloc.id);
  }

  onNomInput(event: Event): void {
    this.nomCategoria.set((event.target as HTMLInputElement).value);
  }

  obrirFormulari(): void {
    this.mostrantFormulari.set(true);
  }

  cancelarFormulari(): void {
    this.mostrantFormulari.set(false);
    this.nomCategoria.set('');
    this.colorSeleccionat.set(this.colors[0]);
    this.iconaSeleccionada.set(this.icones[0]);
  }

  crear(event: Event): void {
    event.preventDefault();
    if (!this.nomCategoria().trim()) return;
    this.contingut.crearCategoria(this.nomCategoria(), this.colorSeleccionat(), this.iconaSeleccionada());
    this.cancelarFormulari();
  }
}
