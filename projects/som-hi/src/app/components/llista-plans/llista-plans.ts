import { Component, inject } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { PlansService } from '../../services/plans.service';
import { TraduccioService } from '../../services/traduccio.service';
import { PlaCard } from '../pla-card/pla-card';

@Component({
  selector: 'app-llista-plans',
  standalone: true,
  imports: [PlaCard],
  templateUrl: './llista-plans.html',
  styleUrl: './llista-plans.css',
})
export class LlistaPlans {
  protected readonly plans = inject(PlansService);
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
}
