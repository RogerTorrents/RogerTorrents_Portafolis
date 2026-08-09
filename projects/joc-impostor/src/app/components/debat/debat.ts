import { Component, inject, computed } from '@angular/core';
import { JocService } from '../../services/joc.service';

@Component({
  selector: 'app-debat',
  standalone: true,
  templateUrl: './debat.html',
  styleUrl: './debat.css',
})
export class Debat {
  readonly joc = inject(JocService);

  readonly dadesRonda = computed(() => this.joc.obtenirDadesRonda());
  readonly jugadors = computed(() => this.joc.estatPartida()?.jugadors ?? []);
  readonly jugadorInicial = computed(() => this.joc.estatPartida()?.jugadorInicial ?? '');
}
