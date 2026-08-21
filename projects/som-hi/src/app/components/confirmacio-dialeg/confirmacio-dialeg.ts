import { Component, inject } from '@angular/core';
import { ConfirmacioService } from '../../services/confirmacio.service';
import { TraduccioService } from '../../services/traduccio.service';

@Component({
  selector: 'app-confirmacio-dialeg',
  standalone: true,
  templateUrl: './confirmacio-dialeg.html',
  styleUrl: './confirmacio-dialeg.css',
})
export class ConfirmacioDialeg {
  protected readonly confirmacio = inject(ConfirmacioService);
  protected readonly ts = inject(TraduccioService);
}
