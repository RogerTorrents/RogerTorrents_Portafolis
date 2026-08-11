import { Component, inject } from '@angular/core';
import { NavegacioService } from './services/navegacio.service';
import { MenuPrincipal } from './components/menu-principal/menu-principal';
import { Joc1Minuts } from './components/jocs/joc1-minuts/joc1-minuts';
import { Joc2Alineacio } from './components/jocs/joc2-alineacio/joc2-alineacio';
import { Joc3Dorsal } from './components/jocs/joc3-dorsal/joc3-dorsal';
import { Joc4Titols } from './components/jocs/joc4-titols/joc4-titols';

@Component({
  selector: 'app-root',
  imports: [MenuPrincipal, Joc1Minuts, Joc2Alineacio, Joc3Dorsal, Joc4Titols],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly nav = inject(NavegacioService);
}
