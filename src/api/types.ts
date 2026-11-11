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

export type ProjectSummary = Schemas['ProjectSummary']
export type ProjectDetail = Schemas['ProjectDetail']
export type ProjectStatus = ProjectSummary['status']
export type ProjectType = ProjectSummary['type']
export type PublicProfile = Schemas['PublicProfile']
export type BadgeProgress = Schemas['BadgeProgress']
export type ReputationEntry = Schemas['ReputationEntry']
export type QuestionSummary = Schemas['QuestionSummary']
export type MissionSummary = Schemas['MissionSummary']
export type ProjectUpdate = Schemas['ProjectUpdate']

export type PlaytestSummary = Schemas['PlaytestSummary']
export type AdminPlaytestSummary = Schemas['AdminPlaytestSummary']
export type PlaytestDetail = Schemas['PlaytestDetail']
export type PlaytestStatus = PlaytestSummary['status']
export type PlaytestPlatform = PlaytestSummary['platform']
export type PlaytestParticipation = Schemas['PlaytestParticipation']
export type PlaytestEvent = Schemas['PlaytestEvent']
export type PlaytestStats = Schemas['PlaytestStats']
export type HomeStats = Schemas['HomeStats']

export type Page<T> = { items: T[]; page: number; size: number; total: number }

type Query<P extends keyof paths> = paths[P] extends { get: { parameters: { query?: infer Q } } }
  ? NonNullable<Q>
  : never

export type ProjectsQuery = Query<'/api/v1/projects'>
export type ReputationQuery = Query<'/api/v1/users/{username}/reputation'>
export type QuestionsQuery = Query<'/api/v1/questions'>
export type MissionsQuery = Query<'/api/v1/missions'>
export type AdminPlaytestsQuery = Query<'/api/v1/admin/playtests'>
export type UsersQuery = Query<'/api/v1/admin/users'>
export type TagsQuery = Query<'/api/v1/admin/tags'>
export type CasesQuery = Query<'/api/v1/admin/cases'>
export type ReferentCasesQuery = Query<'/api/v1/moderation/cases'>
export type JobsQuery = Query<'/api/v1/admin/jobs'>
export type ChallengesQuery = Query<'/api/v1/admin/challenges'>
export type SubmissionsQuery = Query<'/api/v1/admin/challenges/{id}/submissions'>
export type CommunitiesQuery = Query<'/api/v1/admin/communities'>
export type ProposalsQuery = Query<'/api/v1/admin/community-proposals'>
