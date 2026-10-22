import { useEffect, useState } from 'react';
import type { QuestionSummary } from '../../api/provisional-types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { questionsApi } from './questionsApi';
import { TITLE_MIN } from './validation';

/** Attente après la dernière frappe : une seule recherche par pause, pour ménager la 3G. */
export const SIMILAR_DEBOUNCE_MS = 500;
export const SIMILAR_MAX = 5;

export type SimilarState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; items: QuestionSummary[] };

/**
 * Questions similaires pendant la saisie du titre (QA-8), par la recherche plein texte
 * du fil. Rien n'est cherché sous 15 caractères ni hors ligne.
 */
export function useSimilarQuestions(title: string): SimilarState {
  const online = useOnlineStatus();
  const [state, setState] = useState<SimilarState>({ status: 'idle' });
  const query = title.trim();
  const enabled = online && query.length >= TITLE_MIN;

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState({ status: 'loading' });
      try {
        const page = await questionsApi.search(query, SIMILAR_MAX, controller.signal);
        setState({ status: 'done', items: page.items.slice(0, SIMILAR_MAX) });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' });
      }
    }, SIMILAR_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query]);

  return state;
}
