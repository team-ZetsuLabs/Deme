/**
 * Drapeau d'un pays à partir de son code ISO à deux lettres (lettres indicatrices régionales).
 * Sans image à télécharger ; sous Windows, le navigateur affiche les deux lettres à la place.
 */
export function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
