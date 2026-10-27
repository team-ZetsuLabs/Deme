import { api } from '../../api/api';
import type {
  ApplicationStatus,
  JobDetail,
  JobRequest,
  JobSummary,
  JobType,
  MyApplication,
  Page,
  ReceivedApplication,
} from '../../api/types';

export const JOBS_PAGE_SIZE = 20;

/** Filtre « type » de JOB-1 : CDI, à distance, mission, stage. */
export type JobTypeFilter = 'all' | JobType;

export const JOB_TYPES: JobType[] = ['PERMANENT', 'REMOTE', 'CONTRACT', 'INTERNSHIP'];

export type JobFilters = {
  type: JobTypeFilter;
  country: string | null;
  tech: string | null;
  page: number;
};

export type ApplyRequest = {
  message: string;
  cv: File | null;
};

export const jobsApi = {
  list: (f: JobFilters) =>
    api.get<Page<JobSummary>>('/jobs', {
      query: {
        type: f.type === 'all' ? undefined : f.type,
        country: f.country,
        technology: f.tech,
        page: f.page,
        size: JOBS_PAGE_SIZE,
      },
    }),
  get: (id: number) => api.get<JobDetail>(`/jobs/${id}`),
  create: (body: JobRequest) => api.post<JobDetail>('/jobs', body),
  /** Candidature (JOB-3) : le profil Zetsu est joint par le serveur, le CV PDF est facultatif. */
  apply: (id: number, body: ApplyRequest) => {
    const form = new FormData();
    form.append('message', body.message);
    if (body.cv) form.append('cv', body.cv);
    return api.post<MyApplication>(`/jobs/${id}/applications`, form);
  },
  /** Candidatures et propositions de mission envoyées par le membre (JOB-7). */
  myApplications: (page: number) =>
    api.get<Page<MyApplication>>('/users/me/applications', {
      query: { page, size: JOBS_PAGE_SIZE },
    }),
  /** Offres publiées par le recruteur connecté, quel que soit leur statut. */
  mine: (page: number) =>
    api.get<Page<JobSummary>>('/jobs/mine', { query: { page, size: JOBS_PAGE_SIZE } }),
  close: (id: number) => api.post<JobDetail>(`/jobs/${id}/close`),
  /** Candidatures reçues sur une offre, pour son recruteur. */
  applications: (id: number, page: number) =>
    api.get<Page<ReceivedApplication>>(`/jobs/${id}/applications`, {
      query: { page, size: JOBS_PAGE_SIZE },
    }),
  /** Décision du recruteur ou de l'auteur d'une mission sur une candidature. */
  decide: (applicationId: number, status: Extract<ApplicationStatus, 'SHORTLISTED' | 'REJECTED'>) =>
    api.patch<ReceivedApplication>(`/applications/${applicationId}`, { status }),
  /** CV joint à une candidature : servi par le serveur au recruteur, ouvert dans un nouvel onglet. */
  cvUrl: (applicationId: number) => `/api/v1/applications/${applicationId}/cv`,
};
