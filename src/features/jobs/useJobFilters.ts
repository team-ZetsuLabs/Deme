import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JOB_TYPES, type JobFilters, type JobTypeFilter } from './jobsApi';

const TYPES: JobTypeFilter[] = ['all', ...JOB_TYPES];

/** Filtres des offres dans l'adresse, comme pour le fil des questions. */
export function useJobFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<JobFilters>(() => {
    const type = params.get('type') as JobTypeFilter;
    const page = Number(params.get('page') ?? '1');
    return {
      type: TYPES.includes(type) ? type : 'all',
      country: params.get('country'),
      tech: params.get('tech'),
      page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    };
  }, [params]);

  const update = useCallback(
    (changes: Partial<Record<keyof JobFilters, string | number | null>>) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          const isDefault =
            value === null ||
            value === '' ||
            (key === 'type' && value === 'all') ||
            (key === 'page' && value === 0);
          if (isDefault) next.delete(key);
          else next.set(key, key === 'page' ? String(Number(value) + 1) : String(value));
        }
        return next;
      });
    },
    [setParams],
  );

  return { filters, update };
}
