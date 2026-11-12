import { api } from '../../api/api';
import type {
  Answer,
  AnswerRequest,
  Comment,
  Page,
  QuestionDetail,
  QuestionImage,
  QuestionRequest,
  QuestionSummary,
  VoteResult,
} from '../../api/types';

export const PAGE_SIZE = 20;
/** Réponses chargées avec la question : le serveur en accepte 50 au plus par page. */
export const ANSWERS_PAGE_SIZE = 50;

/** Valeurs de l'adresse (?status=open), traduites vers celles du contrat dans list(). */
export type QuestionStatus = 'all' | 'open' | 'solved';
export type QuestionSort = 'relevance' | 'recent' | 'votes';

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

const STATUS = { all: 'ALL', open: 'UNSOLVED', solved: 'SOLVED' } as const;
const SORT = { relevance: 'RELEVANCE', recent: 'RECENT', votes: 'VOTES' } as const;

const votePath = (target: VoteTarget, id: number) =>
  `/${target === 'question' ? 'questions' : 'answers'}/${id}/votes`;

export const questionsApi = {
  list: (f: QuestionFilters) =>
    api.get<Page<QuestionSummary>>('/questions', {
      query: {
        status: f.status === 'all' ? undefined : STATUS[f.status],
        sort: SORT[f.sort],
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
    api.get<Page<QuestionSummary>>('/questions', {
      query: { q, sort: SORT.relevance, page: 0, size },
      signal,
    }),
  get: (id: number) => api.get<QuestionDetail>(`/questions/${id}`),
  /** Réponses, réponse acceptée en tête puis par score : l'ordre vient du serveur. */
  answers: (questionId: number) =>
    api.get<Page<Answer>>(`/questions/${questionId}/answers`, {
      query: { page: 0, size: ANSWERS_PAGE_SIZE },
    }),
  /** Envoi d'une photo de question (max 2, QA, contrat provisoire — voir message back-end). */
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    const image = await api.post<QuestionImage>('/questions/images', form);
    // En mock, le serveur ne stocke rien : on affiche la photo choisie localement (URL d'objet).
    return api.mode === 'mock' ? { ...image, url: URL.createObjectURL(file) } : image;
  },
  create: (body: QuestionRequest) => api.post<QuestionDetail>('/questions', body),
  /** Modifier sa question (QA-3). Le serveur vérifie que le membre en est l'auteur. */
  update: (id: number, body: QuestionRequest) => api.put<QuestionDetail>(`/questions/${id}`, body),
  answer: (questionId: number, body: AnswerRequest) =>
    api.post<Answer>(`/questions/${questionId}/answers`, body),
  updateAnswer: (answerId: number, body: AnswerRequest) =>
    api.put<Answer>(`/answers/${answerId}`, body),
  /** L'auteur de la question accepte une réponse (QA-5) ; renvoie la question à jour. */
  accept: (questionId: number, answerId: number) =>
    api.put<QuestionDetail>(`/questions/${questionId}/accepted-answer`, { answerId }),
  /** Commenter une question ou une réponse (QA-9). */
  comment: (target: VoteTarget, id: number, body: string) =>
    api.post<Comment>(`/${target === 'question' ? 'questions' : 'answers'}/${id}/comments`, {
      body,
    }),
  /** Supprimer un commentaire (son auteur ou l'équipe). */
  deleteComment: (commentId: number) => api.delete<void>(`/comments/${commentId}`),
  /** Vote positif (QA-4). Le contrat accepte aussi -1 ; le cahier ne demande que « voter pour ». */
  vote: (target: VoteTarget, id: number) =>
    api.post<VoteResult>(votePath(target, id), { value: 1 }),
  unvote: (target: VoteTarget, id: number) => api.delete<VoteResult>(votePath(target, id)),
};
