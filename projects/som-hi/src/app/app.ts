import { Component, inject } from '@angular/core';
import { ConfirmacioDialeg } from './components/confirmacio-dialeg/confirmacio-dialeg';
import { PantallaEntrada } from './components/pantalla-entrada/pantalla-entrada';
import { FormulariLogin } from './components/formulari-login/formulari-login';
import { FormulariRegistre } from './components/formulari-registre/formulari-registre';
import { Capcalera } from './components/capcalera/capcalera';
import { LlistaPlans } from './components/llista-plans/llista-plans';
import { CrearPla } from './components/crear-pla/crear-pla';
import { DetallPla } from './components/detall-pla/detall-pla';
import { NavegacioService } from './services/navegacio.service';
import { SessioService } from './services/sessio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ConfirmacioDialeg,
    PantallaEntrada,
    FormulariLogin,
    FormulariRegistre,
    Capcalera,
    LlistaPlans,
    CrearPla,
    DetallPla,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly sessio = inject(SessioService);
  protected readonly nav = inject(NavegacioService);
}
