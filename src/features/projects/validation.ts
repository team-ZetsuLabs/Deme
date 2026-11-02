/** Règles de PRJ, à garder identiques à celles du serveur une fois le contrat confirmé. */
export const PROJECT_TITLE_MIN = 10;
export const PROJECT_TITLE_MAX = 120;
export const PROJECT_DESC_MIN = 60;
export const JOIN_MESSAGE_MIN = 20;
export const JOIN_MESSAGE_MAX = 600;
export const UPDATE_MIN = 5;
export const UPDATE_MAX = 1000;

export function validateProjectTitle(value: string): string | null {
  const length = value.trim().length;
  return length < PROJECT_TITLE_MIN || length > PROJECT_TITLE_MAX
    ? 'projects.form.errors.title'
    : null;
}

export function validateProjectDescription(value: string): string | null {
  return value.trim().length < PROJECT_DESC_MIN ? 'projects.form.errors.description' : null;
}

/** Lien GitHub ou de contact : https uniquement (sécurité, CLAUDE.md). Vide accepté. */
export function validateHttpsUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? null : 'projects.form.errors.url';
  } catch {
    return 'projects.form.errors.url';
  }
}

export function validateJoinMessage(value: string): string | null {
  return value.trim().length < JOIN_MESSAGE_MIN ? 'projects.join.messageTooShort' : null;
}

export function validateUpdate(value: string): string | null {
  return value.trim().length < UPDATE_MIN ? 'projects.updates.tooShort' : null;
}
