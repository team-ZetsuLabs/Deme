import { api } from '../../api/api';
import type { Page, PublicProfile, ReputationEntry } from '../../api/types';

export const REPUTATION_PAGE_SIZE = 20;

export const usersApi = {
  get: (username: string) => api.get<PublicProfile>(`/users/${encodeURIComponent(username)}`),
  /** Historique des points (REP-1) : chaque action est un événement enregistré. */
  reputation: (username: string, page = 0) =>
    api.get<Page<ReputationEntry>>(`/users/${encodeURIComponent(username)}/reputation`, {
      query: { page, size: REPUTATION_PAGE_SIZE },
    }),
};
