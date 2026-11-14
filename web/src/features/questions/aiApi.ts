import { api, ApiError } from '../../api/api';
import type { QuestionAssist, QuestionAssistRequest } from '../../api/types';

/** Sans réponse dans ce délai, l'assistant s'efface et le formulaire reste utilisable (IA-1). */
export const AI_TIMEOUT_MS = 8000;

/** Texte minimal (titre et détails) pour que l'analyse ait un sens. */
export const AI_MIN_TEXT = 20;

export const aiApi = {
  /** Suggestions pour une question ; rejette avec le code AI_TIMEOUT au-delà de 8 secondes. */
  assistQuestion: async (
    body: QuestionAssistRequest,
    signal?: AbortSignal,
  ): Promise<QuestionAssist> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const forward = () => controller.abort();
    signal?.addEventListener('abort', forward);
    try {
      return await api.post<QuestionAssist>('/ai/question-assist', body, {
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError' && !signal?.aborted) {
        throw new ApiError(0, { code: 'AI_TIMEOUT', message: "L'assistant n'a pas répondu" });
      }
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forward);
    }
  },
};
