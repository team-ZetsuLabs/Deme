import { api } from '../../api/api';
import type {
  AppNotification,
  MarkReadRequest,
  NotificationTarget,
  Page,
  UnreadCount,
} from '../../api/types';

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationsApi = {
  list: (page: number) =>
    api.get<Page<AppNotification>>('/notifications', {
      query: { page, size: NOTIFICATIONS_PAGE_SIZE },
    }),
  unreadCount: () => api.get<UnreadCount>('/notifications/unread-count'),
  /** Sans ids : tout marquer comme lu. Renvoie le compteur à jour. */
  markRead: (body: MarkReadRequest) => api.post<UnreadCount>('/notifications/read', body),
};

/** Page de destination d'une notification. */
export function notificationLink(target: NotificationTarget): string {
  const { id } = target;
  switch (target.type) {
    case 'QUESTION':
      return `/questions/${id}`;
    case 'ANSWER':
      return target.questionId ? `/questions/${target.questionId}#answer-${id}` : '/questions';
    case 'JOB':
      return `/jobs/${id}`;
    case 'MISSION':
      return `/missions/${id}`;
    case 'PROJECT':
      return `/projects/${id}`;
    case 'CHALLENGE':
      return '/challenges';
    case 'APPLICATION':
      return '/applications';
    case 'COMMUNITY_PROPOSAL':
      return '/communities/new';
    case 'USER':
      return '/settings';
  }
}
