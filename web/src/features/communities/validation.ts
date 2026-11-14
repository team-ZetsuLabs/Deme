/** Règles d'une proposition de communauté (COM-2), identiques à celles attendues du serveur. */
export const NAME_MIN = 3;
export const NAME_MAX = 40;
export const DESCRIPTION_MIN = 30;
export const DESCRIPTION_MAX = 200;
export const RULES_MAX = 5;
export const RULE_MAX = 200;

const TAG_PATTERN = /^[a-z0-9][a-z0-9.-]{0,34}$/;

export function validateName(value: string): string | null {
  const length = value.trim().length;
  return length < NAME_MIN || length > NAME_MAX ? 'communities.propose.errors.name' : null;
}

export function validateDescription(value: string): string | null {
  const length = value.trim().length;
  return length < DESCRIPTION_MIN || length > DESCRIPTION_MAX
    ? 'communities.propose.errors.description'
    : null;
}

export function validateTag(value: string): string | null {
  return TAG_PATTERN.test(value.trim()) ? null : 'communities.propose.errors.tag';
}

/** Une règle par ligne ; les lignes vides sont ignorées. */
export function parseRules(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateRules(value: string): string | null {
  const rules = parseRules(value);
  if (rules.length > RULES_MAX) return 'communities.propose.errors.rulesCount';
  return rules.some((rule) => rule.length > RULE_MAX)
    ? 'communities.propose.errors.ruleLength'
    : null;
}
