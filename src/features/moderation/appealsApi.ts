import { api } from '../../api/api';
import type { AppealRequest } from '../../api/provisional-types';

export const appealsApi = {
  create: (body: AppealRequest) => api.post<void>('/appeals', body),
};

export const APPEAL_MIN = 20;
export const APPEAL_MAX = 500;
