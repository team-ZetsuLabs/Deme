import { api } from '../../api/api';
import type { MyModeratedContent, Page } from '../../api/types';

export const appealsApi = {
  /** Mes contenus signalés ou masqués, avec leur dossier de modération (MOD-3). */
  mine: (page = 0) =>
    api.get<Page<MyModeratedContent>>('/users/me/moderation', { query: { page, size: 20 } }),
  /** Contester le masquage devant l'équipe, une seule fois par dossier. 409 ALREADY_APPEALED. */
  create: (caseId: number, message: string) =>
    api.post<MyModeratedContent>(`/moderation/cases/${caseId}/appeal`, { message }),
};

export const APPEAL_MIN = 20;
export const APPEAL_MAX = 1000;
