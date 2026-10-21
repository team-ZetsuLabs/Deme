import { api } from '../../api/api';
import type {
  JobDetail,
  JobRequest,
  JobSummary,
  MyApplication,
  Page,
} from '../../api/provisional-types';

export const JOBS_PAGE_SIZE = 20;

/** Filtre « type » de JOB-1 : CDI, à distance, mission, stage. */
export type JobTypeFilter = 'all' | 'FULL_TIME' | 'REMOTE' | 'CONTRACT' | 'INTERNSHIP';

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
        tech: f.tech,
        page: f.page,
        size: JOBS_PAGE_SIZE,
      },
    }),
  get: (id: number) => api.get<JobDetail>(`/jobs/${id}`),
  create: (body: JobRequest) => api.post<JobDetail>('/jobs', body),
  /** Candidature (JOB-3) : le profil Zetsu est joint par le serveur, le CV est facultatif. */
  apply: (id: number, body: ApplyRequest) => {
    const form = new FormData();
    form.append('message', body.message);
    if (body.cv) form.append('cv', body.cv);
    return api.post<MyApplication>(`/jobs/${id}/apply`, form);
  },
  myApplications: (page: number) =>
    api.get<Page<MyApplication>>('/me/applications', { query: { page, size: JOBS_PAGE_SIZE } }),
};
