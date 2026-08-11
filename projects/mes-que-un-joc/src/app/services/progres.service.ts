import { Injectable, signal } from '@angular/core';
import { EpocaId } from '../models/epoca.model';
import { JocId, JOCS_IDS } from '../models/joc.model';

const CLAU_STORAGE = 'mqj-progres-v1';

type ProgresEpoca = Record<JocId, number>;
type ProgresComplet = Record<EpocaId, ProgresEpoca>;

function progresEpocaBuit(): ProgresEpoca {
  return { joc1: 0, joc2: 0, joc3: 0, joc4: 0 };
}

function progresComplertBuit(): ProgresComplet {
  return { sempre: progresEpocaBuit(), y2000: progresEpocaBuit(), y2015: progresEpocaBuit() };
}

/** Valida que un valor desat a localStorage té la forma esperada, per evitar corrupció de dades. */
function esProgresEpocaValid(valor: unknown): valor is ProgresEpoca {
  if (typeof valor !== 'object' || valor === null) return false;
  return JOCS_IDS.every(joc => {
    const n = (valor as Record<string, unknown>)[joc];
    return typeof n === 'number' && n >= 0 && n <= 5;
  });
}

/** Progrés persistit a localStorage: millors estrelles per joc i època (màxim 5 per joc, 20 per època). */
@Injectable({ providedIn: 'root' })
export class ProgresService {
  private readonly progres = signal<ProgresComplet>(this.carregar());

  estrellesJoc(epoca: EpocaId, joc: JocId): number {
    return this.progres()[epoca][joc];
  }

  estrellesEpoca(epoca: EpocaId): number {
    const p = this.progres()[epoca];
    return JOCS_IDS.reduce((total, joc) => total + p[joc], 0);
  }

  registrarResultat(epoca: EpocaId, joc: JocId, estrelles: number): void {
    const actual = this.progres()[epoca][joc];
    if (estrelles <= actual) return;
    this.progres.update(p => ({ ...p, [epoca]: { ...p[epoca], [joc]: estrelles } }));
    this.desar();
  }

  private carregar(): ProgresComplet {
    const buit = progresComplertBuit();
    try {
      const cru = localStorage.getItem(CLAU_STORAGE);
      if (!cru) return buit;
      const parsejat = JSON.parse(cru) as Partial<Record<EpocaId, unknown>>;
      for (const epoca of Object.keys(buit) as EpocaId[]) {
        const valorEpoca = parsejat[epoca];
        if (esProgresEpocaValid(valorEpoca)) {
          buit[epoca] = valorEpoca;
        }
      }
      return buit;
    } catch {
      return buit;
    }
  }

  private desar(): void {
    try {
      localStorage.setItem(CLAU_STORAGE, JSON.stringify(this.progres()));
    } catch {
      // localStorage no disponible (mode privat, quota plena...); el progrés només viu en memòria.
    }
  }
}
