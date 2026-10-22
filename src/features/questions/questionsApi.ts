import { api } from '../../api/api';
import type {
  Answer,
  AnswerRequest,
  Page,
  QuestionDetail,
  QuestionRequest,
  QuestionSummary,
  VoteResult,
} from '../../api/provisional-types';

export const PAGE_SIZE = 20;

export type QuestionStatus = 'all' | 'open' | 'solved';
export type QuestionSort = 'recent' | 'votes';

export type QuestionFilters = {
  status: QuestionStatus;
  sort: QuestionSort;
  tag: string | null;
  country: string | null;
  operator: string | null;
  q: string | null;
  page: number;
};

export type VoteTarget = 'question' | 'answer';

export const questionsApi = {
  list: (f: QuestionFilters) =>
    api.get<Page<QuestionSummary>>('/questions', {
      query: {
        status: f.status === 'all' ? undefined : f.status,
        sort: f.sort,
        tag: f.tag,
        country: f.country,
        operator: f.operator,
        q: f.q,
        page: f.page,
        size: PAGE_SIZE,
      },
    }),
  /** Recherche plein texte courte, pour les questions similaires (QA-8). */
  search: (q: string, size: number, signal?: AbortSignal) =>
    api.get<Page<QuestionSummary>>('/questions', { query: { q, page: 0, size }, signal }),
  get: (id: number) => api.get<QuestionDetail>(`/questions/${id}`),
  create: (body: QuestionRequest) => api.post<QuestionDetail>('/questions', body),
  answer: (questionId: number, body: AnswerRequest) =>
    api.post<Answer>(`/questions/${questionId}/answers`, body),
  updateAnswer: (answerId: number, body: AnswerRequest) =>
    api.put<Answer>(`/answers/${answerId}`, body),
  accept: (questionId: number, answerId: number) =>
    api.post<void>(`/questions/${questionId}/accept/${answerId}`),
  vote: (target: VoteTarget, id: number) => api.put<VoteResult>(`/votes/${target}/${id}`),
  unvote: (target: VoteTarget, id: number) => api.delete<VoteResult>(`/votes/${target}/${id}`),
};
