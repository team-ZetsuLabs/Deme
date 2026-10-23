import type { AuthorSummary, Me } from '../api/types';

/** Membre connecté des tests, au format du contrat (même compte que les mocks : aminata_dev). */
export function demoMe(overrides: Partial<Me> = {}): Me {
  return {
    id: 12,
    username: 'aminata_dev',
    displayName: 'Aminata Diallo',
    email: 'aminata.diallo@exemple.sn',
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
    skills: [],
    providers: [],
    hasPassword: true,
    onboarded: true,
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
    ...overrides,
  };
}
