import { api } from '../../api/api';
import type {
  JoinProjectRequest,
  Page,
  ProjectDetail,
  ProjectInput,
  ProjectJoinRequest,
  ProjectRequest,
  ProjectRequestStatus,
  ProjectSummary,
  ProjectType,
  ProjectUpdate,
  ProjectUpdateInput,
} from '../../api/types';

export const PROJECTS_PAGE_SIZE = 20;

/** Filtre « type » de PRJ : projet d'étude, startup, open source. */
export type ProjectTypeFilter = 'all' | ProjectType;

export const PROJECT_TYPES: ProjectType[] = ['STUDY', 'STARTUP', 'OPEN_SOURCE'];

export type ProjectFilters = {
  type: ProjectTypeFilter;
  tech: string | null;
  page: number;
};

export const projectsApi = {
  list: (f: ProjectFilters) =>
    api.get<Page<ProjectSummary>>('/projects', {
      query: {
        type: f.type === 'all' ? undefined : f.type,
        technology: f.tech,
        page: f.page,
        size: PROJECTS_PAGE_SIZE,
      },
    }),
  get: (id: number) => api.get<ProjectDetail>(`/projects/${id}`),
  /** Projets portés par le membre connecté. (Contrat d'écriture provisoire, à confirmer.) */
  mine: (page: number) =>
    api.get<Page<ProjectSummary>>('/projects/mine', { query: { page, size: PROJECTS_PAGE_SIZE } }),
  create: (body: ProjectInput) => api.post<ProjectDetail>('/projects', body),
  update: (id: number, body: ProjectInput) => api.put<ProjectDetail>(`/projects/${id}`, body),
  /** Clôturer son projet (PRJ) : passe le statut à COMPLETED. */
  complete: (id: number) => api.post<ProjectDetail>(`/projects/${id}/complete`),
  /** Demander à rejoindre un projet, sur un rôle ouvert ou de façon générale (roleId null). */
  join: (id: number, body: JoinProjectRequest) =>
    api.post<ProjectRequest>(`/projects/${id}/requests`, body),
  /** Annuler sa demande en attente. */
  cancelRequest: (id: number) => api.delete<void>(`/projects/${id}/requests/me`),
  /** Demandes reçues par le porteur, pour les accepter ou refuser. */
  requests: (id: number, page: number) =>
    api.get<Page<ProjectJoinRequest>>(`/projects/${id}/requests`, {
      query: { page, size: PROJECTS_PAGE_SIZE },
    }),
  /** Décision du porteur sur une demande : accepter (ajoute à l'équipe) ou refuser. */
  decideRequest: (
    projectId: number,
    requestId: number,
    status: Extract<ProjectRequestStatus, 'ACCEPTED' | 'REJECTED'>,
  ) => api.patch<ProjectJoinRequest>(`/projects/${projectId}/requests/${requestId}`, { status }),
  /** Mises à jour postées sur le projet. */
  updates: (id: number, page: number) =>
    api.get<Page<ProjectUpdate>>(`/projects/${id}/updates`, {
      query: { page, size: PROJECTS_PAGE_SIZE },
    }),
  /** Poster une mise à jour (réservé à l'équipe, `canPostUpdate`). */
  postUpdate: (id: number, body: ProjectUpdateInput) =>
    api.post<ProjectUpdate>(`/projects/${id}/updates`, body),
};
