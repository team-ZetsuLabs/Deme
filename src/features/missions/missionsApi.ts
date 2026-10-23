import { api } from '../../api/api';
import type {
  MissionDetail,
  MissionKind,
  MissionOffer,
  MissionRequest,
  MissionSummary,
  MyApplication,
  OfferDecision,
  OfferRequest,
  Page,
} from '../../api/types';

export const MISSIONS_PAGE_SIZE = 20;

export type MissionKindFilter = 'all' | MissionKind;

export type MissionFilters = {
  kind: MissionKindFilter;
  tech: string | null;
  page: number;
};

export const missionsApi = {
  list: (f: MissionFilters) =>
    api.get<Page<MissionSummary>>('/missions', {
      query: {
        kind: f.kind === 'all' ? undefined : f.kind,
        tech: f.tech,
        status: 'OPEN',
        page: f.page,
        size: MISSIONS_PAGE_SIZE,
      },
    }),
  get: (id: number) => api.get<MissionDetail>(`/missions/${id}`),
  create: (body: MissionRequest) => api.post<MissionDetail>('/missions', body),
  offer: (id: number, body: OfferRequest) =>
    api.post<MyApplication>(`/missions/${id}/offers`, body),
  decide: (id: number, offerId: number, body: OfferDecision) =>
    api.patch<MissionOffer>(`/missions/${id}/offers/${offerId}`, body),
};
