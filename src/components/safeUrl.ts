/**
 * Renvoie l'adresse seulement si elle commence par http:// ou https://.
 * Toute URL venant d'un membre passe par ici avant d'être un lien (sinon javascript: passe).
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
