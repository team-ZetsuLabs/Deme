// Types provisoires, remplacés par ceux de src/api/api-types.ts une fois le contrat reçu.
export type ReportTarget = 'question' | 'answer' | 'offer' | 'mission' | 'project' | 'profile'
export type ReportReason = 'spam' | 'offensive' | 'offTopic' | 'impersonation' | 'fraudulentOffer'
export type ReportStatus = 'pending' | 'ignored' | 'hidden' | 'warned' | 'suspended'
export type ReportAction = 'ignore' | 'hide' | 'warn' | 'suspend'

export type ReportItem = {
  id: number
  target: ReportTarget
  reason: ReportReason
  count: number
  excerpt: string
  author: string
  country: string
  reportedAt: string
  status: ReportStatus
}

export type ContestStatus = 'pending' | 'upheld' | 'restored'

export type ContestItem = {
  id: number
  target: ReportTarget
  excerpt: string
  author: string
  country: string
  message: string
  status: ContestStatus
}

export const STATUS_AFTER_ACTION: Record<ReportAction, ReportStatus> = {
  ignore: 'ignored',
  hide: 'hidden',
  warn: 'warned',
  suspend: 'suspended',
}
