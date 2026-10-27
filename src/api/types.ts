// Alias lisibles des types générés (api-types.ts, npm run gen:api). On ne recopie aucun type à la main.
import type { components, paths } from './api-types'

type Schemas = components['schemas']

export type Me = Schemas['Me']
export type Role = Me['role']
export type Level = Me['level']
export type AdminUser = Schemas['AdminUser']
export type AuthorSummary = Schemas['AuthorSummary']
export type AdminTag = Schemas['AdminTag']
export type ModerationCase = Schemas['ModerationCase']
export type CaseDecisionRequest = Schemas['CaseDecisionRequest']
export type CaseAction = CaseDecisionRequest['action']
export type ReportReason = Schemas['ReasonCount']['reason']
export type TargetType = Schemas['ModerationTarget']['type']
export type JobDetail = Schemas['JobDetail']
export type Challenge = Schemas['Challenge']
export type ChallengeRequest = Schemas['ChallengeRequest']
export type AdminSubmission = Schemas['AdminSubmission']
export type AdminCommunity = Schemas['AdminCommunity']
export type CommunityRequest = Schemas['CommunityRequest']
export type AdminCommunityProposal = Schemas['AdminCommunityProposal']

export type Page<T> = { items: T[]; page: number; size: number; total: number }

type Query<P extends keyof paths> = paths[P] extends { get: { parameters: { query?: infer Q } } }
  ? NonNullable<Q>
  : never

export type UsersQuery = Query<'/api/v1/admin/users'>
export type TagsQuery = Query<'/api/v1/admin/tags'>
export type CasesQuery = Query<'/api/v1/admin/cases'>
export type ReferentCasesQuery = Query<'/api/v1/moderation/cases'>
export type JobsQuery = Query<'/api/v1/admin/jobs'>
export type ChallengesQuery = Query<'/api/v1/admin/challenges'>
export type SubmissionsQuery = Query<'/api/v1/admin/challenges/{id}/submissions'>
export type CommunitiesQuery = Query<'/api/v1/admin/communities'>
export type ProposalsQuery = Query<'/api/v1/admin/community-proposals'>
