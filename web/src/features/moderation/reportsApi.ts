import { api } from '../../api/api';
import type { ReportReason, ReportReceipt, ReportRequest, ReportTargetType } from '../../api/types';

export const reportsApi = {
  create: (body: ReportRequest) => api.post<ReportReceipt>('/reports', body),
};

/** Motifs proposés selon le contenu : « offre frauduleuse » n'a de sens que pour une offre ou une mission. */
export function reasonsFor(target: ReportTargetType): ReportReason[] {
  const base: ReportReason[] = ['SPAM', 'OFFENSIVE', 'OFF_TOPIC', 'IMPERSONATION'];
  return target === 'JOB' || target === 'MISSION' ? [...base, 'FRAUDULENT_JOB'] : base;
}

export const COMMENT_MAX = 300;
