/**
 * Ritme (min/km) d'una sessió de córrer — sempre CALCULAT a partir de
 * `km`/`tempsMinuts`, mai desat: si l'usuari edita la distància o el temps,
 * el ritme mostrat ha de quedar sempre coherent sense haver-lo de tocar.
 * Retorna `null` si `km` és 0 (evita dividir per zero).
 */
export function ritmeMinutsPerKm(km: number, tempsMinuts: number): string | null {
  if (!km) return null;
  const segonsPerKmArrodonits = Math.round((tempsMinuts * 60) / km);
  const minuts = Math.floor(segonsPerKmArrodonits / 60);
  const segons = segonsPerKmArrodonits % 60;
  return `${minuts}:${String(segons).padStart(2, '0')}`;
}
