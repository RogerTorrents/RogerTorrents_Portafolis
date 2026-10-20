import { Component, inject } from '@angular/core';
import { JocService } from './services/joc.service';
import { TraduccioService } from './services/traduccio.service';
import { Configuracio } from './components/configuracio/configuracio';
import { Repartiment } from './components/repartiment/repartiment';
import { Debat } from './components/debat/debat';
import { Revelacio } from './components/revelacio/revelacio';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Configuracio, Repartiment, Debat, Revelacio],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly joc = inject(JocService);
  // S'injecta a l'arrel perquè escolti el missatge d'idioma del Shell des de l'inici
  private readonly ts = inject(TraduccioService);
}
