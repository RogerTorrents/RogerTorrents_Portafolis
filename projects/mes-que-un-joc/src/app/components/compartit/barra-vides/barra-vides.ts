import { Component, computed, input } from '@angular/core';
import { VIDES_INICIALS } from '../../../models/joc.model';

@Component({
  selector: 'app-barra-vides',
  templateUrl: './barra-vides.html',
  styleUrl: './barra-vides.css',
})
export class BarraVides {
  readonly vides = input.required<number>();

  readonly cors = computed(() =>
    Array.from({ length: VIDES_INICIALS }, (_, i) => i < this.vides())
  );
}
