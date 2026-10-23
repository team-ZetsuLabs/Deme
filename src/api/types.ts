/**
 * Types de l'API utilisés par le site.
 *
 * - Sprint 1 (comptes, questions, réponses, votes, profils, tags) : alias des types
 *   générés dans api-types.ts à partir du contrat publié (docs/openapi.json). On ne
 *   les recopie pas : on les nomme, c'est tout.
 * - Champs attendus par le site mais absents du contrat : ajoutés en facultatif
 *   ci-dessous (« Extras »), proposés au back-end. Ils disparaissent quand le contrat
 *   les publie.
 * - Domaines des sprints suivants : provisional-types.ts.
 */
import type { components } from './api-types';
import type { Comment, HiddenState, OAuthProviderId } from './provisional-types';

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

export type Level = Schemas['Me']['level'];
export type Role = Schemas['Me']['role'];
export type AuthorSummary = Schemas['AuthorSummary'];
export type QuestionContext = Schemas['QuestionContext'];
export type MobileMoneyOperator = NonNullable<QuestionContext['mobileMoneyOperator']>;
export type NetworkQuality = NonNullable<QuestionContext['networkQuality']>;
export type QuestionSummary = Schemas['QuestionSummary'];
export type QuestionRequest = Schemas['QuestionRequest'];
export type AnswerRequest = Schemas['AnswerRequest'];
export type VoteResult = Schemas['VoteResult'];
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type UpdateProfileRequest = Schemas['UpdateProfileRequest'];
export type ReputationEntry = Schemas['ReputationEntry'];
export type ReputationReason = ReputationEntry['reason'];
export type TagCount = Schemas['TagCount'];
export type AuthProvider = Schemas['AuthProvider'];

/** Réponse paginée commune du contrat (PageResponse…) : ?page=0&size=20. */
export type Page<T> = { items: T[]; page: number; size: number; total: number };

/** Pas encore dans le contrat : stack (AUTH-5), comptes liés (SET-4), parcours d'accueil, email vérifié (AUTH-4). */
export type MeExtras = {
  skills?: string[];
  providers?: OAuthProviderId[];
  hasPassword?: boolean;
  /** Absent : considéré comme fait, pour ne pas bloquer un membre sur le parcours d'accueil. */
  onboarded?: boolean;
  /** Absent : adresse considérée comme confirmée. */
  emailVerified?: boolean;
};

export type Me = Schemas['Me'] & MeExtras;

/** Pas encore dans le contrat : compétences, badges (REP-4), réponses acceptées, seuil du niveau suivant. */
export type PublicProfileExtras = {
  skills?: string[];
  badges?: string[];
  acceptedCount?: number;
  nextLevelAt?: number | null;
};

export type PublicProfile = Schemas['PublicProfile'] & PublicProfileExtras;

/** Pas encore dans le contrat : contenu masqué (MOD-2, MOD-3) et commentaires (QA-9). */
export type ContentExtras = {
  hidden?: HiddenState | null;
  comments?: Comment[];
};

export type QuestionDetail = Schemas['QuestionDetail'] & ContentExtras;
export type Answer = Schemas['Answer'] & ContentExtras;

/**
 * Modification du profil : PUT /users/me attend le profil complet (displayName, language et
 * visibleToRecruiters obligatoires). Le site n'envoie que ce qui change ; authApi complète.
 * Les Extras partent aussi, mais le serveur ne les enregistre pas encore.
 */
export type MeUpdate = Partial<UpdateProfileRequest> & Pick<MeExtras, 'skills' | 'onboarded'>;
