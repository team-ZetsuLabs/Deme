const PALETTE_SIZE = 8;

function hash(value: string): number {
  let h = 7;
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** Couleur stable (variable de tokens.css) calculée à partir du nom. */
export function avatarColor(name: string): string {
  return `var(--av-${(hash(name) % PALETTE_SIZE) + 1})`;
}

export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
