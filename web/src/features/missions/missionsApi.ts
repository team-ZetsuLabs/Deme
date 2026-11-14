import { api } from '../../api/api';
import type {
  MissionApplicationRequest,
  MissionDetail,
  MissionKind,
  MissionRequest,
  MissionSummary,
  MyApplication,
  Page,
  ReceivedApplication,
} from '../../api/types';

export const MISSIONS_PAGE_SIZE = 20;

export type MissionKindFilter = 'all' | MissionKind;

export const MISSION_KINDS: MissionKind[] = [
  'TROUBLESHOOTING',
  'INTEGRATION',
  'CODE_REVIEW',
  'OTHER',
];

export type MissionFilters = {
  kind: MissionKindFilter;
  country: string | null;
  tech: string | null;
  page: number;
};

export const missionsApi = {
  list: (f: MissionFilters) =>
    api.get<Page<MissionSummary>>('/missions', {
      query: {
        kind: f.kind === 'all' ? undefined : f.kind,
        country: f.country,
        technology: f.tech,
        status: 'OPEN',
        page: f.page,
        size: MISSIONS_PAGE_SIZE,
      },
    }),
  get: (id: number) => api.get<MissionDetail>(`/missions/${id}`),
  create: (body: MissionRequest) => api.post<MissionDetail>('/missions', body),
  /** Modifier sa mission, tant qu'elle est ouverte. 409 MISSION_NOT_OPEN. */
  update: (id: number, body: MissionRequest) => api.put<MissionDetail>(`/missions/${id}`, body),
  /** Se proposer pour une mission. 409 ALREADY_APPLIED. */
  offer: (id: number, body: MissionApplicationRequest) =>
    api.post<MyApplication>(`/missions/${id}/applications`, body),
  /** Propositions reçues, pour l'auteur de la mission. Décision : jobsApi.decide. */
  applications: (id: number, page: number) =>
    api.get<Page<ReceivedApplication>>(`/missions/${id}/applications`, {
      query: { page, size: MISSIONS_PAGE_SIZE },
    }),
  close: (id: number) => api.post<MissionDetail>(`/missions/${id}/close`),
};
