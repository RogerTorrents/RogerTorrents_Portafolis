import type { DiaSetmana } from '../models/assignacio.model';

/**
 * Totes les dates d'aquesta app són "només data" ('YYYY-MM-DD'), sense hora.
 * A diferència del backend (que fa aritmètica en UTC perquè treballa amb
 * rangs ja coneguts), aquí "avui" i "dies restants" es calculen sempre amb
 * l'hora LOCAL del navegador — mai `new Date('YYYY-MM-DD')` sol, que
 * JavaScript interpreta com a mitjanit UTC i pot mostrar el dia anterior en
 * fusos horaris negatius.
 */

/**
 * Prisma serialitza els camps `@db.Date` com a timestamp ISO complet
 * (`"2026-08-24T00:00:00.000Z"`), no com a `"YYYY-MM-DD"` — cal normalitzar
 * qualsevol data que vingui de l'API abans de fer-hi servir la resta
 * d'utilitats d'aquest fitxer (que esperen sempre `"YYYY-MM-DD"`).
 */
export function normalitzarDataISO(dataApi: string): string {
  return dataApi.slice(0, 10);
}

export function avuiISO(): string {
  return formatarDataISO(new Date());
}

export function parsejarDataLocal(dataISO: string): Date {
  const [any, mes, dia] = dataISO.split('-').map(Number);
  return new Date(any, mes - 1, dia);
}

export function formatarDataISO(data: Date): string {
  const any = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${any}-${mes}-${dia}`;
}

export function afegirDiesISO(dataISO: string, dies: number): string {
  const data = parsejarDataLocal(dataISO);
  data.setDate(data.getDate() + dies);
  return formatarDataISO(data);
}

/** Diferència en dies (b - a), positiva si b és posterior a a. */
export function diesEntre(aISO: string, bISO: string): number {
  const unDia = 1000 * 60 * 60 * 24;
  const a = parsejarDataLocal(aISO);
  const b = parsejarDataLocal(bISO);
  return Math.round((b.getTime() - a.getTime()) / unDia);
}

const DIES_SETMANA_JS: readonly DiaSetmana[] = [
  'DIUMENGE',
  'DILLUNS',
  'DIMARTS',
  'DIMECRES',
  'DIJOUS',
  'DIVENDRES',
  'DISSABTE',
];

export function diaSetmanaDe(dataISO: string): DiaSetmana {
  return DIES_SETMANA_JS[parsejarDataLocal(dataISO).getDay()];
}

/** Índex de dia de la setmana amb 0 = dilluns ... 6 = diumenge (a diferència de `Date.getDay()`, que fa servir 0 = diumenge). */
export function indexDiaSetmana(dataISO: string): number {
  return (parsejarDataLocal(dataISO).getDay() + 6) % 7;
}

export function dataFiPla(dataIniciISO: string, durationSetmanes: number): string {
  return afegirDiesISO(dataIniciISO, durationSetmanes * 7 - 1);
}

/** Índex de la setmana (1-indexat) a la qual pertany `dataISO` dins del pla. */
export function setmanaDe(dataIniciISO: string, dataISO: string): number {
  return Math.floor(diesEntre(dataIniciISO, dataISO) / 7) + 1;
}
