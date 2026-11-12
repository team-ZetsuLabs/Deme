import { api } from '../../api/api';
import type {
  MyPlaytestEntry,
  Page,
  PlaytestConfirmRequest,
  PlaytestDetail,
  PlaytestFeedback,
  PlaytestFeedbackRequest,
  PlaytestParticipation,
  PlaytestRemoveRequest,
  PlaytestRequest,
  PlaytestStatus,
  PlaytestSummary,
  PlaytestWithdrawRequest,
} from '../../api/types';

export const PLAYTESTS_PAGE_SIZE = 20;

/** Filtre d'affichage de la liste publique (TST-1). */
export type PlaytestListFilter = 'ACTIVE' | 'COMPLETED';
export type PlaytestAvailabilityFilter = 'all' | 'OPEN' | 'FULL';

export type PlaytestFilters = {
  status: PlaytestListFilter;
  availability: PlaytestAvailabilityFilter;
  page: number;
};

export const playtestsApi = {
  list: (f: PlaytestFilters) =>
    api.get<Page<PlaytestSummary>>('/playtests', {
      query: {
        status: f.status as PlaytestStatus,
        availability: f.availability === 'all' ? undefined : f.availability,
        page: f.page,
        size: PLAYTESTS_PAGE_SIZE,
      },
    }),
  /** Mes campagnes, tous statuts (brouillons compris). */
  mine: (page: number) =>
    api.get<Page<PlaytestSummary>>('/playtests/mine', {
      query: { page, size: PLAYTESTS_PAGE_SIZE },
    }),
  /** Mes participations à des tests fermés, avec leurs compteurs. */
  myParticipations: (page: number) =>
    api.get<Page<MyPlaytestEntry>>('/users/me/playtest-participations', {
      query: { page, size: PLAYTESTS_PAGE_SIZE },
    }),
  get: (id: number) => api.get<PlaytestDetail>(`/playtests/${id}`),
  /** Crée un brouillon (TST-1). Publier ensuite avec submit. platform obligatoire (TST-7). */
  create: (body: PlaytestRequest) => api.post<PlaytestDetail>('/playtests', body),
  /** Modifier une campagne en brouillon ou refusée. 409 PLAYTEST_NOT_EDITABLE. */
  update: (id: number, body: PlaytestRequest) => api.put<PlaytestDetail>(`/playtests/${id}`, body),
  /** Publier sa campagne (ACTIVE tout de suite, ou PENDING_REVIEW selon le niveau). */
  submit: (id: number) => api.post<PlaytestDetail>(`/playtests/${id}/submit`),
  /** Clôturer sa campagne. */
  close: (id: number) => api.post<PlaytestDetail>(`/playtests/${id}/close`),

  /** Rejoindre une campagne (TST-2). Prend une place et donne optInUrl. */
  join: (id: number) => api.post<PlaytestDetail>(`/playtests/${id}/participations`),
  /** Déclarer l'installation : le décompte des jours commence. */
  confirm: (id: number, body: PlaytestConfirmRequest) =>
    api.post<PlaytestDetail>(`/playtests/${id}/participations/me/confirm`, body),
  /** « Toujours inscrit », une fois par jour (UTC). */
  checkIn: (id: number) => api.post<PlaytestDetail>(`/playtests/${id}/participations/me/check-in`),
  /** Se désister ; la place se libère. Motif facultatif. */
  withdraw: (id: number, body: PlaytestWithdrawRequest) =>
    api.post<PlaytestDetail>(`/playtests/${id}/participations/me/withdraw`, body),

  /** Testeurs de sa campagne (porteur). */
  participations: (id: number) =>
    api.get<PlaytestParticipation[]>(`/playtests/${id}/participations`),
  /** Marquer un testeur vérifié dans la Play Console (porteur). */
  verify: (id: number, participationId: number) =>
    api.post<PlaytestParticipation[]>(`/playtests/${id}/participations/${participationId}/verify`),
  /** Retirer un testeur (porteur), avec motif. */
  removeTester: (id: number, participationId: number, body: PlaytestRemoveRequest) =>
    api.post<PlaytestParticipation[]>(
      `/playtests/${id}/participations/${participationId}/remove`,
      body,
    ),

  /** Retour d'un testeur au porteur (TST, contrat provisoire — voir message back-end). */
  sendFeedback: (id: number, body: PlaytestFeedbackRequest) =>
    api.post<PlaytestFeedback>(`/playtests/${id}/feedback`, body),
  /** Retours reçus par le porteur (TST, contrat provisoire). */
  feedback: (id: number) => api.get<PlaytestFeedback[]>(`/playtests/${id}/feedback`),
};
