/** Règles de JOB-3 et JOB-4, identiques à celles du serveur. */
export const MESSAGE_MIN = 40;
export const MESSAGE_MAX = 600;
export const CV_MAX_BYTES = 2 * 1024 * 1024;

export function validateMessage(value: string): string | null {
  return value.trim().length < MESSAGE_MIN ? 'jobs.apply.messageTooShort' : null;
}

/** CV : PDF uniquement, 2 Mo au plus. Le serveur vérifie le type réel du fichier. */
export function cvError(file: File): string | null {
  if (file.type !== 'application/pdf') return 'jobs.apply.cvType';
  if (file.size > CV_MAX_BYTES) return 'jobs.apply.cvSize';
  return null;
}

/** Site de l'entreprise : https uniquement (sécurité, CLAUDE.md). */
export function validateWebsite(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? null : 'jobs.new.errors.website';
  } catch {
    return 'jobs.new.errors.website';
  }
}

export function validateJobTitle(value: string): string | null {
  const length = value.trim().length;
  return length < 10 || length > 120 ? 'jobs.new.errors.title' : null;
}

export function validateCompany(value: string): string | null {
  return value.trim().length < 2 ? 'jobs.new.errors.company' : null;
}

export function validateDescription(value: string): string | null {
  return value.trim().length < 100 ? 'jobs.new.errors.description' : null;
}
