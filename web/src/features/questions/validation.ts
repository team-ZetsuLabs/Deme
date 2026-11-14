/** Règles de QA-1, identiques à celles du serveur. */
export const TITLE_MIN = 15;
export const TITLE_MAX = 150;
export const BODY_MIN = 30;
export const TAGS_MIN = 1;
export const TAGS_MAX = 4;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 300;

const TAG_PATTERN = /^[a-z0-9][a-z0-9.+#-]{0,34}$/;

export function parseTags(value: string): string[] {
  const tags = value
    .split(',')
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
  return [...new Set(tags)];
}

export function validateTitle(value: string): string | null {
  const length = value.trim().length;
  return length < TITLE_MIN || length > TITLE_MAX ? 'ask.errors.titleLength' : null;
}

export function validateBody(value: string): string | null {
  return value.trim().length < BODY_MIN ? 'ask.errors.bodyLength' : null;
}

export function validateTags(value: string): string | null {
  const tags = parseTags(value);
  if (tags.length < TAGS_MIN || tags.length > TAGS_MAX) return 'ask.errors.tagsCount';
  return tags.every((tag) => TAG_PATTERN.test(tag)) ? null : 'ask.errors.tagFormat';
}
