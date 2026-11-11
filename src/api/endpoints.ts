import { api } from './api'
import type {
  AdminCommunity,
  AdminCommunityProposal,
  AdminSubmission,
  AdminTag,
  AdminUser,
  CaseDecisionRequest,
  CasesQuery,
  Challenge,
  ChallengeRequest,
  ChallengesQuery,
  CommunitiesQuery,
  CommunityRequest,
  JobDetail,
  JobsQuery,
  Me,
  AdminPlaytestSummary,
  AdminPlaytestsQuery,
  HomeStats,
  PlaytestDetail,
  PlaytestEvent,
  PlaytestParticipation,
  PlaytestStats,
  BadgeProgress,
  MissionSummary,
  MissionsQuery,
  ProjectDetail,
  ProjectSummary,
  ProjectUpdate,
  ProjectsQuery,
  PublicProfile,
  QuestionSummary,
  QuestionsQuery,
  ReputationEntry,
  ReputationQuery,
  ModerationCase,
  Page,
  ProposalsQuery,
  ReferentCasesQuery,
  Role,
  SubmissionsQuery,
  TagsQuery,
  UsersQuery,
} from './types'

type Signal = { signal?: AbortSignal }

export const authApi = {
  me: (options?: Signal) => api.get<Me>('/auth/me', options),
  login: (email: string, password: string) =>
    api.post<Me>('/auth/login', { body: { email, password } }),
  logout: () => api.post<void>('/auth/logout'),
}

export const adminApi = {
  listUsers: (query: UsersQuery, options?: Signal) =>
    api.get<Page<AdminUser>>('/admin/users', { query, ...options }),
  setRole: (id: number, role: Role) =>
    api.put<AdminUser>(`/admin/users/${id}/role`, { body: { role } }),
  suspend: (id: number, reason: string) =>
    api.post<AdminUser>(`/admin/users/${id}/suspend`, { body: { reason } }),
  reactivate: (id: number) => api.post<AdminUser>(`/admin/users/${id}/reactivate`),

  listTags: (query: TagsQuery, options?: Signal) =>
    api.get<Page<AdminTag>>('/admin/tags', { query, ...options }),
  createTag: (name: string) => api.post<AdminTag>('/admin/tags', { body: { name } }),
  mergeTag: (name: string, into: string) =>
    api.post<AdminTag>(`/admin/tags/${encodeURIComponent(name)}/merge`, { body: { into } }),
  deleteTag: (name: string) => api.delete<void>(`/admin/tags/${encodeURIComponent(name)}`),

  listCases: (query: CasesQuery, options?: Signal) =>
    api.get<Page<ModerationCase>>('/admin/cases', { query, ...options }),
  decideCase: (id: number, body: CaseDecisionRequest) =>
    api.post<ModerationCase>(`/admin/cases/${id}/decision`, { body }),

  listJobs: (query: JobsQuery, options?: Signal) =>
    api.get<Page<JobDetail>>('/admin/jobs', { query, ...options }),
  decideJob: (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) =>
    api.post<JobDetail>(`/admin/jobs/${id}/decision`, { body: { decision, reason } }),

  listChallenges: (query: ChallengesQuery, options?: Signal) =>
    api.get<Page<Challenge>>('/admin/challenges', { query, ...options }),
  createChallenge: (body: ChallengeRequest) => api.post<Challenge>('/admin/challenges', { body }),
  listSubmissions: (id: number, query: SubmissionsQuery, options?: Signal) =>
    api.get<Page<AdminSubmission>>(`/admin/challenges/${id}/submissions`, { query, ...options }),
  reviewSubmission: (
    id: number,
    status: 'VALIDATED' | 'REJECTED',
    score: number,
    feedback?: string,
  ) =>
    api.post<AdminSubmission>(`/admin/submissions/${id}/review`, {
      body: { status, score, feedback },
    }),

  listCommunities: (query: CommunitiesQuery, options?: Signal) =>
    api.get<Page<AdminCommunity>>('/admin/communities', { query, ...options }),
  createCommunity: (body: CommunityRequest) =>
    api.post<AdminCommunity>('/admin/communities', { body }),
  closeCommunity: (slug: string) => api.post<AdminCommunity>(`/admin/communities/${slug}/close`),
  reopenCommunity: (slug: string) => api.post<AdminCommunity>(`/admin/communities/${slug}/reopen`),
  setReferents: (slug: string, usernames: string[]) =>
    api.put<AdminCommunity>(`/admin/communities/${slug}/referents`, { body: { usernames } }),
  listProposals: (query: ProposalsQuery, options?: Signal) =>
    api.get<Page<AdminCommunityProposal>>('/admin/community-proposals', { query, ...options }),
  decideProposal: (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) =>
    api.post<AdminCommunityProposal>(`/admin/community-proposals/${id}/decision`, {
      body: { decision, reason },
    }),
}

export const playtestApi = {
  stats: (options?: Signal) => api.get<PlaytestStats>('/admin/playtests/stats', options),
  list: (query: AdminPlaytestsQuery, options?: Signal) =>
    api.get<Page<AdminPlaytestSummary>>('/admin/playtests', { query, ...options }),
  detail: (id: number, options?: Signal) => api.get<PlaytestDetail>(`/playtests/${id}`, options),
  participations: (id: number, options?: Signal) =>
    api.get<PlaytestParticipation[]>(`/admin/playtests/${id}/participations`, options),
  events: (id: number, options?: Signal) =>
    api.get<Page<PlaytestEvent>>(`/admin/playtests/${id}/events`, {
      query: { size: 30 },
      ...options,
    }),
  review: (id: number, decision: 'APPROVE' | 'REJECT', note?: string) =>
    api.post<PlaytestDetail>(`/admin/playtests/${id}/review`, { body: { decision, note } }),
  suspend: (id: number, note: string) =>
    api.post<PlaytestDetail>(`/admin/playtests/${id}/suspend`, { body: { note } }),
  reactivate: (id: number, note?: string) =>
    api.post<PlaytestDetail>(`/admin/playtests/${id}/reactivate`, { body: { note } }),
  removeTester: (id: number, participationId: number, reason: string) =>
    api.post<PlaytestParticipation[]>(
      `/admin/playtests/${id}/participations/${participationId}/remove`,
      {
        body: { reason },
      },
    ),
}

export const referentApi = {
  listCases: (query: ReferentCasesQuery, options?: Signal) =>
    api.get<Page<ModerationCase>>('/moderation/cases', { query, ...options }),
  decideCase: (id: number, body: CaseDecisionRequest) =>
    api.post<ModerationCase>(`/moderation/cases/${id}/decision`, { body }),
}

/** Lectures publiques du site, utiles à l'administration (projets, fiche d'un membre). */
export const publicApi = {
  stats: (options?: Signal) => api.get<HomeStats>('/stats', options),
  listProjects: (query: ProjectsQuery, options?: Signal) =>
    api.get<Page<ProjectSummary>>('/projects', { query, ...options }),
  project: (id: number, options?: Signal) => api.get<ProjectDetail>(`/projects/${id}`, options),
  projectUpdates: (id: number, options?: Signal) =>
    api.get<Page<ProjectUpdate>>(`/projects/${id}/updates`, { query: { size: 20 }, ...options }),
  profile: (username: string, options?: Signal) =>
    api.get<PublicProfile>(`/users/${encodeURIComponent(username)}`, options),
  badges: (username: string, options?: Signal) =>
    api.get<BadgeProgress[]>(`/users/${encodeURIComponent(username)}/badges`, options),
  reputation: (username: string, query: ReputationQuery, options?: Signal) =>
    api.get<Page<ReputationEntry>>(`/users/${encodeURIComponent(username)}/reputation`, {
      query,
      ...options,
    }),
  listQuestions: (query: QuestionsQuery, options?: Signal) =>
    api.get<Page<QuestionSummary>>('/questions', { query, ...options }),
  listMissions: (query: MissionsQuery, options?: Signal) =>
    api.get<Page<MissionSummary>>('/missions', { query, ...options }),
}
