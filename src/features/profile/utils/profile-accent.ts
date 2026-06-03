// Acento cromatico por usuario. El diseno pide que "cada perfil se sienta unico"
// derivando el color del avatar/banner; como `Profile` no guarda un color propio,
// lo derivamos de forma determinista del id (o handle) para que sea estable.
// Pares cosmicos tomados de la paleta de marca (violeta/cyan/magenta/ambar/aurora).

export type AccentPair = readonly [string, string];

const ACCENT_PAIRS: AccentPair[] = [
  ["#8B5CF6", "#FF4FD8"], // violeta -> magenta
  ["#18D7FF", "#4DF0B0"], // cyan -> aurora
  ["#7B5CFF", "#18D7FF"], // violeta -> cyan
  ["#FF4FD8", "#FFC24D"], // magenta -> ambar
  ["#4DF0B0", "#18D7FF"], // aurora -> cyan
  ["#FFC24D", "#FF7AA8"], // ambar -> rosa
  ["#22E6B9", "#4DF0B0"], // mint -> aurora
  ["#B18CFF", "#22E6B9"], // violeta claro -> mint
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Devuelve un par [accent, accent2] estable para un perfil dado. */
export function getProfileAccent(seed?: string | null): AccentPair {
  if (!seed) {
    return ACCENT_PAIRS[0]!;
  }
  return ACCENT_PAIRS[hashString(seed) % ACCENT_PAIRS.length]!;
}
