import type { Notification } from '../../api/types'

/** Page du back office où mène une notification, ou null quand elle ne concerne pas l'administration. */
export function destinationOf(notification: Notification): string | null {
  const { type, id } = notification.target
  switch (type) {
    case 'PLAYTEST':
      return `/tests/${id}`
    case 'PROJECT':
      return `/projets/${id}`
    case 'JOB':
      return '/offres'
    case 'CHALLENGE':
      return '/challenges'
    case 'COMMUNITY_PROPOSAL':
      return '/communautes'
    case 'APPLICATION':
      return null
    default:
      return null
  }
}
