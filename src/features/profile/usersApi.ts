import { api } from '../../api/api';
import type { PublicProfile } from '../../api/provisional-types';

export const usersApi = {
  get: (id: number) => api.get<PublicProfile>(`/users/${id}`),
};
