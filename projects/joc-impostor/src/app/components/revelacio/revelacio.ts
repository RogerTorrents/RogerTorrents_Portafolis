import { Component, inject, computed } from '@angular/core';
import { JocService } from '../../services/joc.service';

@Component({
  selector: 'app-revelacio',
  standalone: true,
  templateUrl: './revelacio.html',
  styleUrl: './revelacio.css',
})
export class Revelacio {
  readonly joc = inject(JocService);

  readonly dadesRonda = computed(() => this.joc.obtenirDadesRonda());
  readonly impostors = computed(() =>
    this.joc.estatPartida()?.jugadors.filter(j => j.rol === 'impostor') ?? []
  );
  readonly jugadorsNormals = computed(() =>
    this.joc.estatPartida()?.jugadors.filter(j => j.rol === 'jugador') ?? []
  );
}
