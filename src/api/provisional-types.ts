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

/**
 * PROJETS (PRJ) : contrat pas encore publié par le back-end.
 *
 * Les LECTURES (`GET /projects`, `GET /projects/{id}`) sont alignées sur les réponses
 * réelles du back déployé. Les ÉCRITURES ci-dessous sont un contrat PROVISOIRE déduit de
 * `myRequest`, `canEdit`, `canPostUpdate` et des conventions REST : à confirmer avec Salif
 * avant de passer en `live`. Dès publication, ces types partent vers les alias de types.ts.
 */
export type ProjectType = 'STUDY' | 'STARTUP' | 'OPEN_SOURCE';
export type ProjectStatus = 'OPEN' | 'COMPLETED';
export type ProjectRoleStatus = 'OPEN' | 'FILLED';
export type ProjectRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

/** Élément de la liste `GET /projects`. */
export type ProjectSummary = {
  id: number;
  title: string;
  type: ProjectType;
  technologies: string[];
  status: ProjectStatus;
  owner: AuthorSummary;
  openRoles: string[];
  teamSize: number;
  createdAt: string;
  lastActivityAt: string;
};

/** Rôle recherché sur un projet : ouvert, ou pris par un membre. */
export type ProjectRole = {
  id: number;
  title: string;
  technologies: string[];
  status: ProjectRoleStatus;
  member: AuthorSummary | null;
};

/** Membre de l'équipe d'un projet. */
export type ProjectTeamMember = {
  member: AuthorSummary;
  roleTitle: string | null;
  owner: boolean;
  joinedAt: string;
};

/** Demande du membre connecté pour rejoindre un projet (null s'il n'en a pas fait). */
export type ProjectRequest = {
  id: number;
  roleId: number | null;
  roleTitle: string | null;
  message: string;
  status: ProjectRequestStatus;
  createdAt: string;
};

/** Demande reçue par le porteur du projet, avec l'auteur (gestion des demandes). */
export type ProjectJoinRequest = ProjectRequest & { applicant: AuthorSummary };

/** Mise à jour postée par l'équipe sur le projet (contenu de membre, nettoyé serveur). */
export type ProjectUpdate = {
  id: number;
  bodyMarkdown: string;
  bodyHtml: string;
  author: AuthorSummary;
  createdAt: string;
};

/** Détail `GET /projects/{id}`. */
export type ProjectDetail = {
  id: number;
  title: string;
  descriptionMarkdown: string;
  descriptionHtml: string;
  type: ProjectType;
  technologies: string[];
  githubUrl: string | null;
  contactUrl: string | null;
  status: ProjectStatus;
  owner: AuthorSummary;
  roles: ProjectRole[];
  team: ProjectTeamMember[];
  myRequest: ProjectRequest | null;
  canEdit: boolean;
  canPostUpdate: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
};

/** Écritures (provisoires). */
export type ProjectRoleInput = { title: string; technologies: string[] };

export type ProjectInput = {
  title: string;
  descriptionMarkdown: string;
  type: ProjectType;
  technologies: string[];
  githubUrl: string | null;
  contactUrl: string | null;
  roles: ProjectRoleInput[];
};

export type JoinProjectRequest = { roleId: number | null; message: string };

export type ProjectUpdateInput = { bodyMarkdown: string };
