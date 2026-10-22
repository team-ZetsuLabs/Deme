/**
 * Règles côté client, identiques à celles du serveur (AUTH-1).
 * Elles évitent un aller-retour réseau ; le serveur reste la seule vraie barrière.
 * Chaque fonction renvoie une clé de traduction, ou null si la valeur est valide.
 */

export const NAME_MIN = 3;
export const NAME_MAX = 40;
export const PASSWORD_MIN = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateName(value: string): string | null {
  const length = value.trim().length;
  return length < NAME_MIN || length > NAME_MAX ? 'auth.errors.nameLength' : null;
}

export function validateEmail(value: string): string | null {
  return EMAIL_PATTERN.test(value.trim()) ? null : 'auth.errors.emailInvalid';
}

export function validateCountry(value: string): string | null {
  return value ? null : 'auth.errors.countryRequired';
}

export function validateNewPassword(value: string): string | null {
  return value.length >= PASSWORD_MIN && /\d/.test(value) ? null : 'auth.errors.passwordRule';
}

export function validateLoginPassword(value: string): string | null {
  return value ? null : 'auth.errors.passwordRequired';
}

/** Force indicative de 0 (vide) à 4, pour la jauge sous le mot de passe. */
export function passwordStrength(value: string): number {
  if (!value) return 0;
  const score = [
    value.length >= PASSWORD_MIN,
    /\d/.test(value),
    /[A-Z]/.test(value) && /[a-z]/.test(value),
    /[^\w]/.test(value) || value.length >= 14,
  ].filter(Boolean).length;
  return Math.max(score, 1);
}
