/**
 * TYPES PROVISOIRES des points d'entrée que le site utilise mais que le contrat ne publie
 * pas encore (demandés au back-end).
 *
 * Le CLAUDE.md interdit de recopier un type d'API à la main : ce fichier est une
 * exception temporaire. Dès qu'un point d'entrée est publié, son type part vers les
 * alias de types.ts.
 */
import type { AuthorSummary, QuestionContext } from './types';

/** Commentaire court en texte brut (QA-9), 10 à 300 caractères. */
export type Comment = {
  id: number;
  body: string;
  author: AuthorSummary;
  createdAt: string;
};

/** Information qui manque à une question, repérée par l'assistant (IA-1). */
export type MissingInfo =
  'ERROR_MESSAGE' | 'TECH_VERSION' | 'CODE' | 'STEPS_TRIED' | 'EXPECTED_RESULT';

/**
 * POST /api/v1/ai/question-assist (IA-1). Seul le texte de la question est envoyé :
 * ni nom, ni email, ni identifiant. 429 AI_RATE_LIMITED (10 appels par heure),
 * 503 AI_UNAVAILABLE si le fournisseur ne répond pas.
 */
export type QuestionAssistRequest = {
  title: string;
  body: string;
  code: string | null;
};

export type QuestionAssist = {
  title: string | null; // null si le titre est déjà clair
  tags: { name: string; isNew: boolean }[]; // 1 à 4 ; isNew : le tag n'existe pas encore sur Zetsu
  context: QuestionContext; // contexte africain détecté, null pour ce qui n'est pas détecté
  missing: MissingInfo[];
};

/** GET /api/v1/stats : chiffres publics de la page d'accueil, calculés depuis la base. */
export type PublicStats = {
  questions: number;
  answers: number;
  solvedRate: number; // part des questions résolues, entre 0 et 1
  members: number;
  countries: number;
  /** Seuils de réputation en vigueur (abaissés pour la démo, section 8 du cahier). */
  levels: { MEMBER: number; CONTRIBUTOR: number; REFERENT: number };
};

/**
 * Élément de GET /api/v1/challenges/{id}/leaderboard/countries (CH-5).
 * Classé par le serveur : total des notes des dépôts évalués du pays.
 */
export type CountryLeaderboardEntry = {
  rank: number;
  country: string; // code ISO 3166-1 alpha-2
  participants: number; // dépôts du pays, évalués ou non
  points: number;
};
