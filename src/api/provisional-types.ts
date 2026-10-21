/**
 * TYPES PROVISOIRES, en attendant le contrat publié par le back-end.
 *
 * Le CLAUDE.md interdit de recopier un type d'API à la main : ce fichier est
 * une exception temporaire, parce que le contrat du sprint 1 n'existe pas encore.
 * Dès que `npm run gen:api` produit ces types dans api-types.ts, on remplace
 * chaque import de ce fichier, puis on le supprime.
 */

export type Level = 'NEW' | 'MEMBER' | 'CONTRIBUTOR' | 'REFERENT';

/** GET /api/v1/me, et réponse de POST /auth/login et /auth/register. */
export type Me = {
  id: number;
  name: string;
  email: string;
  country: string | null; // code ISO 3166-1 alpha-2, ou "OTHER"
  city: string | null;
  photoUrl: string | null;
  reputation: number;
  level: Level;
  language: 'fr' | 'en';
  skills: string[]; // technologies déclarées, en minuscules (« spring-boot »)
  onboarded: boolean; // false tant que le parcours d'accueil (AUTH-5) n'est pas fait
};

/**
 * PUT /api/v1/me : champs à modifier, les autres restent inchangés.
 * Le parcours d'accueil envoie `onboarded: true` pour le clore.
 */
export type MeUpdate = {
  country?: string;
  language?: 'fr' | 'en';
  skills?: string[];
  onboarded?: boolean;
};

/** POST /api/v1/auth/login */
export type LoginRequest = {
  email: string;
  password: string;
};

/** POST /api/v1/auth/register */
export type RegisterRequest = {
  name: string;
  email: string;
  country: string;
  password: string;
  /** Champ piège anti-robots : toujours vide pour un humain. */
  website: string;
};

/** Réponse paginée commune : ?page=0&size=20 */
export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

/** Auteur affiché à côté d'un contenu. */
export type Author = {
  id: number;
  name: string;
  photoUrl: string | null;
  country: string | null;
  city: string | null;
  reputation: number;
};

export type MobileMoneyOperator = 'ORANGE_MONEY' | 'WAVE' | 'MOOV' | 'MTN' | 'MPESA' | 'OTHER';
export type NetworkQuality = 'GOOD' | 'UNSTABLE' | 'VERY_LOW';

/** Contexte africain d'une question (QA-2), tous les champs sont facultatifs. */
export type QuestionContext = {
  country: string | null;
  operator: MobileMoneyOperator | null;
  network: NetworkQuality | null;
  techVersion: string | null;
};

/** Élément de GET /api/v1/questions */
export type QuestionSummary = {
  id: number;
  title: string;
  excerpt: string; // texte brut, sans Markdown
  tags: string[];
  context: QuestionContext;
  author: Author;
  createdAt: string; // ISO 8601, UTC
  votes: number;
  answerCount: number;
  solved: boolean;
};

export type Answer = {
  id: number;
  body: string; // Markdown d'origine, pour que l'auteur puisse modifier sa réponse (QA-3)
  bodyHtml: string; // Markdown converti et nettoyé par le serveur
  code: string | null; // texte brut
  author: Author;
  createdAt: string;
  votes: number;
  voted: boolean; // le membre connecté a voté
  accepted: boolean;
};

/** GET /api/v1/questions/{id} */
export type QuestionDetail = {
  id: number;
  title: string;
  bodyHtml: string;
  code: string | null;
  tags: string[];
  context: QuestionContext;
  author: Author;
  createdAt: string;
  views: number;
  votes: number;
  voted: boolean;
  answers: Answer[];
};

/** POST /api/v1/questions */
export type QuestionRequest = {
  title: string;
  body: string; // Markdown
  code: string | null;
  tags: string[];
  context: QuestionContext;
};

/** POST /api/v1/questions/{id}/answers et PUT /api/v1/answers/{id} */
export type AnswerRequest = {
  body: string;
  code: string | null;
};

export type ReportTargetType = 'QUESTION' | 'ANSWER' | 'JOB' | 'MISSION' | 'PROJECT' | 'PROFILE';
export type ReportReason = 'SPAM' | 'OFFENSIVE' | 'OFF_TOPIC' | 'IMPERSONATION' | 'FRAUD';

/** POST /api/v1/reports (MOD-1). 409 ALREADY_REPORTED si déjà signalé par ce membre. */
export type ReportRequest = {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  comment: string | null;
};

/** Réponse de PUT et DELETE /api/v1/votes/{question|answer}/{id} */
export type VoteResult = {
  votes: number;
  voted: boolean;
};
