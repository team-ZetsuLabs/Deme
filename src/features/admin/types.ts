// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type MemberRole = 'member' | 'moderator'
export type StaffRole = 'administrator' | 'moderator'
export type UserStatus = 'active' | 'flagged' | 'suspended'
export type Provider = 'GitHub' | 'Google' | 'Email'

export type User = {
  id: string
  name: string
  email: string
  country: string | null
  role: MemberRole
  rep: number
  joinedDays: number
  status: UserStatus
  questions: number
  answers: number
  provider: Provider
  warnings: number
  flags: number
}

export type ReportType = 'answer' | 'question' | 'profile' | 'offer'
export type ReportReason = 'spam' | 'offensive' | 'offTopic' | 'impersonation' | 'fraudulentOffer'
export type ReportContext =
  | { kind: 'answerTo'; title: string }
  | { kind: 'questionIn'; tag: string }
  | { kind: 'profileIntro' }
  | { kind: 'offer'; title: string }

export type Report = {
  id: number
  type: ReportType
  reason: ReportReason
  count: number
  at: number
  author: string
  reporters: string[]
  context: ReportContext
  content: string
}

export type ContentStatus = 'published' | 'hidden' | 'closed'

export type ContentItem = {
  id: number
  title: string
  author: string
  tags: string[]
  answers: number
  flags: number
  status: ContentStatus
  daysAgo: number
}

export type Tag = { name: string; count: number; synonyms: string[]; createdDaysAgo: number }

export type JobCheck = { key: 'domain' | 'pay' | 'description'; ok: boolean }
export type JobType = 'permanent' | 'mission' | 'internship'

export type PendingJob = {
  id: number
  title: string
  company: string
  city: string | null
  type: JobType
  by: string
  at: number
  checks: JobCheck[]
  about: string
  missions: string[]
}

export type PublishedJob = { title: string; company: string; daysAgo: number; applicants: number }
export type RefusedJob = { title: string; company: string; daysAgo: number; reason: string }

export type ChallengeStatus = 'ongoing' | 'upcoming' | 'finished'
export type Challenge = {
  id: number
  title: string
  status: ChallengeStatus
  start: string
  end: string
  submissions: number
  points: number
}

export type SubmissionStatus = 'toGrade' | 'validated' | 'rejected'
export type Submission = {
  id: number
  user: string
  repo: string
  at: number
  status: SubmissionStatus
  score?: number
  note?: 'empty' | 'offBrief'
}

export type StaffMember = {
  id: string
  name: string
  email: string
  role: StaffRole
  lastSeen: { kind: 'online' } | { kind: 'minutes' | 'hours' | 'days'; value: number }
}

export type AuditDetail = { key: string; params?: Record<string, string | number> } | string

export type AuditEntry = {
  id: number
  at: number
  who: string
  action: string
  target: AuditDetail
  detail?: AuditDetail
}

export type Settings = {
  autoHide: number
  manualJobs: boolean
  require2fa: boolean
  session: '1h' | '8h' | '24h'
  banned: string
}
