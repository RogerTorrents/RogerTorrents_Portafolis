import { Component, OnInit, inject, output } from '@angular/core';
import type { PlaPredefinit } from '../../models/pla-predefinit.model';
import { PlansPredefinitsService } from '../../services/plans-predefinits.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-galeria-plans-predefinits',
  standalone: true,
  templateUrl: './galeria-plans-predefinits.html',
  styleUrl: './galeria-plans-predefinits.css',
})
export class GaleriaPlansPredefinits implements OnInit {
  protected readonly predefinits = inject(PlansPredefinitsService);
  protected readonly ts = inject(TraduccioService);

  readonly tornar = output<void>();
  readonly triar = output<PlaPredefinit>();

  ngOnInit(): void {
    this.predefinits.carregar();
  }
}
