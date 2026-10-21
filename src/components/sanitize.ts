import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'h3',
  'h4',
  'hr',
];

// Liens des membres : uniquement http(s), jamais javascript: ni data:.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

/** Deuxième barrière : le serveur a déjà nettoyé ce HTML avec sa liste blanche. */
export function sanitizeMemberHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  });
}
