import { api } from '../../api/api';
import type {
  CommunityDetail,
  CommunityKind,
  CommunityProposal,
  CommunityProposalRequest,
  CommunitySummary,
  MembershipResult,
  Page,
  QuestionSummary,
} from '../../api/types';

export const COMMUNITIES_PAGE_SIZE = 20;

export type CommunityKindFilter = 'all' | CommunityKind;

export type CommunityFilters = {
  kind: CommunityKindFilter;
  q: string | null;
  page: number;
};

const path = (slug: string) => `/communities/${encodeURIComponent(slug)}`;

export const communitiesApi = {
  list: (f: CommunityFilters) =>
    api.get<Page<CommunitySummary>>('/communities', {
      query: {
        kind: f.kind === 'all' ? undefined : f.kind,
        q: f.q,
        page: f.page,
        size: COMMUNITIES_PAGE_SIZE,
      },
    }),
  /** Communautés du membre connecté. */
  mine: () => api.get<CommunitySummary[]>('/users/me/communities'),
  get: (slug: string) => api.get<CommunityDetail>(path(slug)),
  join: (slug: string) => api.post<MembershipResult>(`${path(slug)}/members`),
  leave: (slug: string) => api.delete<MembershipResult>(`${path(slug)}/members`),
  /** Proposition d'un Référent (COM-2), « En attente » jusqu'à la décision de l'équipe. */
  propose: (body: CommunityProposalRequest) =>
    api.post<CommunityProposal>('/community-proposals', body),
  myProposals: () => api.get<CommunityProposal[]>('/users/me/community-proposals'),
  /** Questions de la communauté : nouveau filtre `community` sur GET /questions. */
  questions: (slug: string, page: number) =>
    api.get<Page<QuestionSummary>>('/questions', {
      query: { community: slug, sort: 'RECENT', page, size: COMMUNITIES_PAGE_SIZE },
    }),
};
