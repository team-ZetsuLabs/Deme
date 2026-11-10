/**
 * Types de l'API utilisés par le site.
 *
 * - Tout ce que le contrat publie (docs/openapi.json) : alias des types générés dans
 *   api-types.ts. On ne les recopie pas : on les nomme, c'est tout.
 * - Champs attendus par le site mais absents du contrat : ajoutés en facultatif
 *   ci-dessous (« Extras »), proposés au back-end. Ils disparaissent quand le contrat
 *   les publie.
 * - Points d'entrée pas encore publiés (IA, commentaires, statistiques…) : provisional-types.ts.
 */
import type { components } from './api-types';
import type { Comment } from './provisional-types';

export * from './provisional-types';

/**
 * Le générateur type un champ facultatif en `string | undefined`, mais le serveur (Jackson)
 * envoie `null`. On accepte donc aussi null sur les champs facultatifs, à toute profondeur.
 */
type WithNull<T> = T extends (infer U)[]
  ? WithNull<U>[]
  : T extends object
    ? {
        [K in keyof T]: undefined extends T[K]
          ? WithNull<Exclude<T[K], undefined>> | null | undefined
          : WithNull<T[K]>;
      }
    : T;

type Schemas = { [K in keyof components['schemas']]: WithNull<components['schemas'][K]> };

/** Réponse paginée commune du contrat (PageResponse…) : ?page=0&size=20. */
export type Page<T> = { items: T[]; page: number; size: number; total: number };

// Comptes et profils
export type Level = Schemas['Me']['level'];
export type Role = Schemas['Me']['role'];
export type AuthorSummary = Schemas['AuthorSummary'];
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type UpdateProfileRequest = Schemas['UpdateProfileRequest'];
export type OnboardingRequest = Schemas['OnboardingRequest'];
export type AuthProvider = Schemas['AuthProvider'];
export type Connections = Schemas['Connections'];
export type ConnectedAccount = Schemas['ConnectedAccount'];
export type OAuthProviderId = ConnectedAccount['provider'];
export type LinkStart = Schemas['LinkStart'];
export type ReputationEntry = Schemas['ReputationEntry'];
export type ReputationReason = ReputationEntry['reason'];

/** Pas encore dans le contrat : email vérifié (AUTH-4). */
export type MeExtras = {
  /** Absent : adresse considérée comme confirmée. */
  emailVerified?: boolean;
};

export type Me = Schemas['Me'] & MeExtras;

/**
 * Pas encore dans le contrat : identifiant (pour signaler un profil, MOD-1), badges (REP-4),
 * réponses acceptées, seuil du niveau suivant.
 */
export type PublicProfileExtras = {
  id?: number;
  badges?: string[];
  acceptedCount?: number;
  nextLevelAt?: number | null;
};

export type PublicProfile = Schemas['PublicProfile'] & PublicProfileExtras;

/**
 * Modification du profil : PUT /users/me attend le profil complet (displayName, language et
 * visibleToRecruiters obligatoires). Le site n'envoie que ce qui change ; authApi complète.
 */
export type MeUpdate = Partial<UpdateProfileRequest>;

// Questions et réponses
export type QuestionContext = Schemas['QuestionContext'];
export type MobileMoneyOperator = NonNullable<QuestionContext['mobileMoneyOperator']>;
export type NetworkQuality = NonNullable<QuestionContext['networkQuality']>;
export type QuestionSummary = Schemas['QuestionSummary'];
export type QuestionRequest = Schemas['QuestionRequest'];
export type AnswerRequest = Schemas['AnswerRequest'];
export type VoteResult = Schemas['VoteResult'];
export type TagCount = Schemas['TagCount'];

/** Pas encore dans le contrat : commentaires (QA-9). */
export type ContentExtras = {
  comments?: Comment[];
};

export type QuestionDetail = Schemas['QuestionDetail'] & ContentExtras;
export type Answer = Schemas['Answer'] & ContentExtras;

// Emploi et missions
export type JobType = Schemas['JobSummary']['type'];
export type JobStatus = Schemas['JobSummary']['status'];
export type JobSummary = Schemas['JobSummary'];
export type JobDetail = Schemas['JobDetail'];
export type JobRequest = Schemas['JobRequest'];
export type StackMatch = Schemas['StackMatch'];
export type ApplicationStatus = Schemas['MyApplication']['status'];
export type ApplicationTarget = Schemas['ApplicationTarget'];
export type MyApplication = Schemas['MyApplication'];
export type MyApplicationRef = Schemas['MyApplicationRef'];
export type ReceivedApplication = Schemas['ReceivedApplication'];
export type ApplicationDecisionRequest = Schemas['ApplicationDecisionRequest'];
export type Budget = Schemas['Budget'];
export type MissionKind = Schemas['MissionSummary']['kind'];
export type MissionStatus = Schemas['MissionSummary']['status'];
export type MissionSummary = Schemas['MissionSummary'];
export type MissionDetail = Schemas['MissionDetail'];
export type MissionRequest = Schemas['MissionRequest'];
export type MissionApplicationRequest = Schemas['MissionApplicationRequest'];

// Défis
export type Challenge = Schemas['Challenge'];
export type MySubmission = Schemas['MySubmission'];
export type SubmissionRequest = Schemas['SubmissionRequest'];
export type LeaderboardEntry = Schemas['LeaderboardEntry'];

// Notifications
export type AppNotification = Schemas['Notification'];
export type NotificationType = AppNotification['type'];
export type NotificationTarget = Schemas['NotificationTarget'];
export type UnreadCount = Schemas['UnreadCount'];
export type MarkReadRequest = Schemas['MarkReadRequest'];

// Modération
export type ReportRequest = Schemas['ReportRequest'];
export type ReportTargetType = ReportRequest['targetType'];
export type ReportReason = ReportRequest['reason'];
export type ReportReceipt = Schemas['ReportReceipt'];
export type AppealRequest = Schemas['AppealRequest'];
export type ModerationCase = Schemas['ModerationCase'];
export type ModerationTarget = Schemas['ModerationTarget'];
export type ModerationDecision = Schemas['ModerationDecision'];
export type CaseDecisionRequest = Schemas['CaseDecisionRequest'];
export type MyModeratedContent = Schemas['MyModeratedContent'];

// Tests fermés Google Play (TST)
export type PlaytestStatus = Schemas['PlaytestSummary']['status'];
export type PlaytestAvailability = 'OPEN' | 'FULL';
export type PlaytestSummary = Schemas['PlaytestSummary'];
export type PlaytestDetail = Schemas['PlaytestDetail'];
export type PlaytestRequest = Schemas['PlaytestRequest'];
export type PlaytestProgress = Schemas['PlaytestProgress'];
export type MyPlaytestParticipation = Schemas['MyPlaytestParticipation'];
export type PlaytestParticipationStatus = MyPlaytestParticipation['status'];
export type PlaytestParticipation = Schemas['PlaytestParticipation'];
export type MyPlaytestEntry = Schemas['MyPlaytestEntry'];
export type PlaytestConfirmRequest = Schemas['PlaytestConfirmRequest'];
export type PlaytestWithdrawRequest = Schemas['PlaytestWithdrawRequest'];
export type PlaytestRemoveRequest = Schemas['PlaytestRemoveRequest'];

// Communautés
export type CommunityKind = Schemas['CommunitySummary']['kind'];
export type CommunitySummary = Schemas['CommunitySummary'];
export type CommunityDetail = Schemas['CommunityDetail'];
export type CommunityProposal = Schemas['CommunityProposal'];
export type CommunityProposalRequest = Schemas['CommunityRequest'];
export type MembershipResult = Schemas['MembershipResult'];
