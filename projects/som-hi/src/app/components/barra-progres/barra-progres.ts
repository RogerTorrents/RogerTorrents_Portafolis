import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-barra-progres',
  standalone: true,
  templateUrl: './barra-progres.html',
  styleUrl: './barra-progres.css',
})
export class BarraProgres {
  readonly percentatge = input.required<number>();

  protected readonly percentatgeFitat = computed(() => Math.min(100, Math.max(0, this.percentatge())));
}
