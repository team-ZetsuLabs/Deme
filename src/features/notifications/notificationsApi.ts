import { api } from '../../api/api';
import type {
  AppNotification,
  MarkReadRequest,
  NotificationTargetType,
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
  markRead: (body: MarkReadRequest) => api.post<void>('/notifications/read', body),
};

/** Page de destination d'une notification. */
export function notificationLink(type: NotificationTargetType, id: number): string {
  switch (type) {
    case 'QUESTION':
      return `/questions/${id}`;
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
  }
}
