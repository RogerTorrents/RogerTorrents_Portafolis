import { Component, inject } from '@angular/core';
import { NavegacioService } from '../../services/navegacio.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-menu-inicial',
  imports: [],
  templateUrl: './menu-inicial.html',
  styleUrl: './menu-inicial.css',
})
export class MenuInicial {
  protected readonly nav = inject(NavegacioService);
  protected readonly ts = inject(TraduccioService);
}
