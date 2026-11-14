/**
 * Géométrie du recadrage carré d'une photo de profil. Tout est en pixels du viewport carré.
 * Fonctions pures (testables) : le dialogue s'en sert pour l'aperçu et pour le rendu canvas.
 */

/** Échelle « cover » : l'image remplit le viewport, le plus petit côté est couvert. */
export const coverScale = (viewport: number, w: number, h: number) =>
  w > 0 && h > 0 ? Math.max(viewport / w, viewport / h) : 1;

/** Borne l'offset (coin haut-gauche de l'image) pour que le viewport reste couvert (pas de bord vide). */
export function clampOffset(
  viewport: number,
  dispW: number,
  dispH: number,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: Math.min(0, Math.max(viewport - dispW, x)),
    y: Math.min(0, Math.max(viewport - dispH, y)),
  };
}

/** Rectangle source (dans l'image d'origine) correspondant au viewport, pour ctx.drawImage. */
export function sourceRect(
  viewport: number,
  scale: number,
  x: number,
  y: number,
): { sx: number; sy: number; size: number } {
  return { sx: -x / scale, sy: -y / scale, size: viewport / scale };
}
