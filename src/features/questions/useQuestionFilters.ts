import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { QuestionFilters, QuestionSort, QuestionStatus } from './questionsApi';

const STATUSES: QuestionStatus[] = ['all', 'open', 'solved'];
const SORTS: QuestionSort[] = ['recent', 'votes'];

/** Les filtres du fil vivent dans l'adresse : une recherche se partage par un lien. */
export function useQuestionFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<QuestionFilters>(() => {
    const status = params.get('status') as QuestionStatus;
    const sort = params.get('sort') as QuestionSort;
    const page = Number(params.get('page') ?? '1');
    return {
      status: STATUSES.includes(status) ? status : 'all',
      sort: SORTS.includes(sort) ? sort : 'recent',
      tag: params.get('tag'),
      country: params.get('country'),
      operator: params.get('operator'),
      q: params.get('q'),
      // Dans l'adresse, la première page est 1 ; l'API compte à partir de 0.
      page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    };
  }, [params]);

  /** Change un ou plusieurs filtres et revient à la première page (sauf si on change de page). */
  const update = useCallback(
    (changes: Partial<Record<keyof QuestionFilters, string | number | null>>) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          const isDefault =
            value === null ||
            value === '' ||
            (key === 'status' && value === 'all') ||
            (key === 'sort' && value === 'recent') ||
            (key === 'page' && value === 0);
          if (isDefault) next.delete(key);
          else next.set(key, key === 'page' ? String(Number(value) + 1) : String(value));
        }
        return next;
      });
    },
    [setParams],
  );

  const activeCount = [filters.tag, filters.country, filters.operator, filters.q].filter(
    Boolean,
  ).length;

  return { filters, update, activeCount };
}
