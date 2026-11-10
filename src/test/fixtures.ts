import type { AuthorSummary, Me, PublicProfile } from '../api/types';

/** Membre connecté des tests, au format du contrat (même compte que les mocks : aminata_dev). */
export function demoMe(overrides: Partial<Me> = {}): Me {
  return {
    id: 12,
    username: 'aminata_dev',
    displayName: 'Aminata Diallo',
    email: 'aminata.diallo@exemple.sn',
    emailVerified: true,
    avatarUrl: null,
    bio: null,
    countryCode: 'SN',
    city: 'Dakar',
    language: 'fr',
    visibleToRecruiters: false,
    role: 'MEMBER',
    reputation: 342,
    level: 'MEMBER',
    createdAt: '2026-09-14T08:21:00Z',
    technologies: [],
    onboardingCompleted: true,
    ...overrides,
  };
}

/** Profil public d'un membre (PublicProfile), pour les candidatures et propositions reçues. */
export function publicProfile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id: 12,
    username: 'aminata_dev',
    displayName: 'Aminata Diallo',
    avatarUrl: null,
    bio: null,
    countryCode: 'SN',
    city: 'Dakar',
    role: 'MEMBER',
    reputation: 342,
    level: 'MEMBER',
    visibleToRecruiters: false,
    technologies: [],
    questionCount: 0,
    answerCount: 0,
    acceptedCount: 0,
    badges: [],
    createdAt: '2026-09-14T08:21:00Z',
    ...overrides,
  };
}

/** Auteur d'un contenu (AuthorSummary). */
export function author(overrides: Partial<AuthorSummary> = {}): AuthorSummary {
  return {
    username: 'aminata_dev',
    displayName: 'Aminata Diallo',
    avatarUrl: null,
    countryCode: 'SN',
    reputation: 342,
    level: 'MEMBER',
    deleted: false,
    ...overrides,
  };
}
