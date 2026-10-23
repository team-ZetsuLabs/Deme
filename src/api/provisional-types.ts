/**
 * TYPES PROVISOIRES des sprints suivants, en attendant leur contrat.
 *
 * Le CLAUDE.md interdit de recopier un type d'API à la main : ce fichier est une
 * exception temporaire. Le sprint 1 vient déjà du contrat (voir types.ts) ; à chaque
 * contrat publié, on déplace les types concernés vers les alias de types.ts.
 */
import type { AuthorSummary, QuestionContext } from './types';

export type OAuthProviderId = 'github' | 'google';

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

export type ReportTargetType = 'QUESTION' | 'ANSWER' | 'JOB' | 'MISSION' | 'PROJECT' | 'PROFILE';
export type ReportReason = 'SPAM' | 'OFFENSIVE' | 'OFF_TOPIC' | 'IMPERSONATION' | 'FRAUD';

/** POST /api/v1/reports (MOD-1). 409 ALREADY_REPORTED si déjà signalé par ce membre. */
export type ReportRequest = {
  targetType: ReportTargetType;
  targetId: number | string; // pseudo pour un profil
  reason: ReportReason;
  comment: string | null;
};

/**
 * Contenu masqué (MOD-2 et MOD-3). Le serveur n'envoie un contenu masqué qu'à son auteur,
 * avec ce champ rempli ; pour tous les autres, le contenu n'apparaît pas.
 */
export type HiddenState = {
  by: 'REPORTS' | 'REFERENT'; // 5 signalements (MOD-2) ou décision d'un Référent (MOD-3)
  reason: ReportReason | null; // motif retenu, null pour un masquage automatique
  appeal: 'NONE' | 'PENDING' | 'REJECTED'; // contestation devant l'équipe
};

/** POST /api/v1/appeals (MOD-3). 409 ALREADY_APPEALED si une contestation existe déjà. */
export type AppealRequest = {
  targetType: ReportTargetType;
  targetId: number;
  message: string; // 20 à 500 caractères
};

export type NotificationType =
  | 'ANSWER_ON_QUESTION'
  | 'ANSWER_ACCEPTED'
  | 'VOTE'
  | 'JOB_MATCH'
  | 'MISSION_MATCH'
  | 'NEW_CHALLENGE'
  | 'APPLICATION_DECISION'
  | 'PROJECT_REQUEST_DECISION';

export type NotificationTargetType =
  'QUESTION' | 'JOB' | 'MISSION' | 'CHALLENGE' | 'PROJECT' | 'APPLICATION';

/** Élément de GET /api/v1/notifications (NOT-1). */
export type AppNotification = {
  id: number;
  type: NotificationType;
  actor: AuthorSummary | null; // null pour une notification de la plateforme (offre, défi…)
  targetType: NotificationTargetType;
  targetId: number;
  targetTitle: string;
  /** Décision pour une candidature ou une demande de projet : VIEWED, SHORTLISTED, ACCEPTED, REJECTED. */
  decision: 'VIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | null;
  createdAt: string;
  read: boolean;
};

/** GET /api/v1/notifications/unread-count */
export type UnreadCount = { count: number };

/** POST /api/v1/notifications/read : des notifications précises, ou toutes. */
export type MarkReadRequest = { ids: number[] } | { all: true };

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

export type ContractType = 'FULL_TIME' | 'CONTRACT' | 'INTERNSHIP';

/** Statut de validation d'une offre par l'équipe (JOB-4). */
export type JobStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'CLOSED';

/** Suivi d'une candidature ou d'une proposition de mission (JOB-7). */
export type ApplicationStatus = 'SENT' | 'VIEWED' | 'SHORTLISTED' | 'REJECTED';

export type Company = {
  name: string;
  logoUrl: string | null;
  website: string | null; // https uniquement, vérifié par le serveur
};

/** Élément de GET /api/v1/jobs (JOB-1). */
export type JobSummary = {
  id: number;
  title: string;
  company: Company;
  city: string | null;
  country: string | null;
  contractType: ContractType;
  remote: boolean;
  technologies: string[];
  salary: string | null; // texte libre : « 450 000 à 600 000 FCFA par mois »
  createdAt: string;
  /** Statut de ma candidature, null si je n'ai pas postulé ou si je ne suis pas connecté. */
  myApplication: ApplicationStatus | null;
};

/** GET /api/v1/jobs/{id} (JOB-2). */
export type JobDetail = JobSummary & {
  experience: string | null; // « 2 à 4 ans d'expérience »
  descriptionHtml: string; // Markdown de l'entreprise, nettoyé par le serveur
  status: JobStatus;
  postedBy: string; // pseudo du membre qui a publié l'offre (pour le signalement)
};

/** POST /api/v1/jobs (JOB-4) : l'offre est créée « En attente » jusqu'à validation. */
export type JobRequest = {
  title: string;
  company: { name: string; website: string | null };
  city: string | null;
  country: string | null;
  contractType: ContractType;
  remote: boolean;
  technologies: string[];
  salary: string | null;
  experience: string | null;
  description: string; // Markdown
};

/** Élément de GET /api/v1/me/applications (JOB-7) : candidatures et propositions de mission. */
export type MyApplication = {
  id: number;
  targetType: 'JOB' | 'MISSION';
  targetId: number;
  title: string;
  organisation: string; // entreprise de l'offre, ou auteur de la mission
  status: ApplicationStatus;
  sentAt: string;
  updatedAt: string;
};

/** Missions courtes entre pairs (JOB-5). */
export type MissionKind = 'FIX' | 'INTEGRATION' | 'CODE_REVIEW' | 'OTHER';
export type MissionStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

/** Montant indicatif : aucun paiement ne passe par Zetsu. */
export type Money = { amount: number; currency: string }; // ISO 4217 : XOF, XAF, GHS, NGN, KES…

/** Élément de GET /api/v1/missions */
export type MissionSummary = {
  id: number;
  title: string;
  kind: MissionKind;
  excerpt: string;
  budget: Money | null;
  delayDays: number;
  technologies: string[];
  author: AuthorSummary;
  createdAt: string;
  status: MissionStatus;
  offerCount: number;
  /** Statut de ma proposition, null si je ne me suis pas proposé. */
  myOffer: ApplicationStatus | null;
};

/** Proposition d'un membre sur une mission, visible par l'auteur de la mission. */
export type MissionOffer = {
  id: number;
  member: AuthorSummary;
  message: string;
  price: Money | null;
  delayDays: number | null;
  status: ApplicationStatus;
  createdAt: string;
};

/** GET /api/v1/missions/{id} : `offers` n'est rempli que pour l'auteur de la mission. */
export type MissionDetail = MissionSummary & {
  descriptionHtml: string;
  offers: MissionOffer[] | null;
};

/** POST /api/v1/missions */
export type MissionRequest = {
  title: string;
  kind: MissionKind;
  description: string; // Markdown
  budget: Money | null;
  delayDays: number;
  technologies: string[];
};

/** POST /api/v1/missions/{id}/offers : se proposer. Renvoie une MyApplication (JOB-7). */
export type OfferRequest = {
  message: string;
  price: Money | null;
  delayDays: number | null;
};

/** PATCH /api/v1/missions/{id}/offers/{offerId} : décision de l'auteur. */
export type OfferDecision = { status: 'SHORTLISTED' | 'REJECTED' };

/** Dépôt d'un membre sur un défi (CH-2), noté par l'équipe sur 100 (CH-3). */
export type Submission = {
  id: number;
  repoUrl: string;
  status: 'PENDING' | 'REVIEWED' | 'REJECTED';
  score: number | null;
  submittedAt: string;
};

/** GET /api/v1/challenges/current (CH-1). 404 NO_CURRENT_CHALLENGE s'il n'y a pas de défi en cours. */
export type Challenge = {
  id: number;
  title: string;
  summary: string;
  /** Spécifications : une ligne par exigence, avec une étiquette courte facultative (« POST »). */
  specs: { label: string | null; text: string }[];
  startsAt: string;
  endsAt: string; // le compte à rebours se calcule depuis cette date, pas depuis « dimanche prochain »
  points: number; // points gagnés pour un dépôt validé (+20, section 8)
  submissionCount: number;
  mySubmission: Submission | null;
};

/** Élément de GET /api/v1/challenges/{id}/leaderboard */
export type LeaderboardEntry = {
  rank: number;
  member: AuthorSummary;
  score: number | null; // null tant que l'équipe n'a pas noté
  submittedAt: string;
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

/** POST /api/v1/challenges/{id}/submissions. 409 ALREADY_SUBMITTED : un dépôt par membre et par défi. */
export type SubmissionRequest = { repoUrl: string };
