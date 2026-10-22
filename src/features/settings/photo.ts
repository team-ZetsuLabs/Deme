export const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/** Vérification rapide côté client ; le serveur contrôle le type réel du fichier. */
export function photoError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'settings.photo.badType';
  if (file.size > PHOTO_MAX_BYTES) return 'settings.photo.tooBig';
  return null;
}
