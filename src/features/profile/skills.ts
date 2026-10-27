/** Technologies proposées d'un clic. Le membre peut en ajouter d'autres. */
export const SUGGESTED_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'node.js',
  'java',
  'spring-boot',
  'php',
  'laravel',
  'python',
  'django',
  'flutter',
  'kotlin',
  'android',
  'docker',
  'postgresql',
  'mysql',
  'mongodb',
  'mobile-money',
  'devops',
  'ui-design',
];

/** Limite du contrat (PUT /users/me/onboarding). */
export const SKILLS_MAX = 10;

const SKILL_PATTERN = /^[a-z0-9][a-z0-9.+#-]{0,34}$/;

/** « Spring Boot » devient « spring-boot ». Renvoie null si le nom n'est pas valable. */
export function normalizeSkill(value: string): string | null {
  const skill = value.trim().toLowerCase().replace(/\s+/g, '-');
  return SKILL_PATTERN.test(skill) ? skill : null;
}
