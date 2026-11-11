import type { PlaytestStatus } from '../../api/types'

export const PLAYTEST_TONE: Record<PlaytestStatus, 'good' | 'warn' | 'crit' | 'neutral'> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warn',
  REJECTED: 'crit',
  ACTIVE: 'good',
  SUSPENDED: 'crit',
  COMPLETED: 'neutral',
}
