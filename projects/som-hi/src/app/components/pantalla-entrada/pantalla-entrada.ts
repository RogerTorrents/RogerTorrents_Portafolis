import { Component, inject } from '@angular/core';
import { SessioService } from '../../services/sessio.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-pantalla-entrada',
  standalone: true,
  templateUrl: './pantalla-entrada.html',
  styleUrl: './pantalla-entrada.css',
})
export class PantallaEntrada {
  protected readonly sessio = inject(SessioService);
  protected readonly ts = inject(TraduccioService);
}
