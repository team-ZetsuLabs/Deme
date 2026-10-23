import { api } from '../../api/api';
import type { PublicStats } from '../../api/types';

export const statsApi = {
  get: () => api.get<PublicStats>('/stats'),
};

/** Seuils de la section 8 du cahier, utilisés tant que /stats n'a pas répondu. */
export const DEFAULT_LEVELS: PublicStats['levels'] = {
  MEMBER: 50,
  CONTRIBUTOR: 500,
  REFERENT: 1500,
};
