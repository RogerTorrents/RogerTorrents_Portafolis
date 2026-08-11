/** Parelles de degradat blaugrana per als avatars il·lustrats de reserva. */
const DEGRADATS: readonly (readonly [string, string])[] = [
  ['#0c3e8c', '#a50044'],
  ['#a50044', '#0c3e8c'],
  ['#051a3d', '#0c3e8c'],
  ['#6e0030', '#a50044'],
];

/** Inicials a partir del nom complet (ex. "Lionel Messi" -> "LM"). */
export function inicialsJugador(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const primera = parts[0][0];
  const darrera = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (primera + darrera).toUpperCase();
}

/** Hash simple i determinista d'un text (mateix jugador -> sempre el mateix degradat). */
function hashText(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function degradatJugador(id: string): readonly [string, string] {
  return DEGRADATS[hashText(id) % DEGRADATS.length];
}
