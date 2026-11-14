export const hintId = (id: string) => `${id}-hint`;
export const errorId = (id: string) => `${id}-error`;

/** Valeur de aria-describedby : l'aide et l'erreur visibles du champ. */
export function describedBy(id: string, hasHint: boolean, error?: string | null) {
  return [hasHint && hintId(id), error && errorId(id)].filter(Boolean).join(' ') || undefined;
}
