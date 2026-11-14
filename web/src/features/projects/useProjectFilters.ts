import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PROJECT_TYPES, type ProjectFilters, type ProjectTypeFilter } from './projectsApi';

const TYPES: ProjectTypeFilter[] = ['all', ...PROJECT_TYPES];

/** Filtres des projets lus dans l'adresse. */
export function parseProjectFilters(params: URLSearchParams): ProjectFilters {
  const type = params.get('type') as ProjectTypeFilter;
  const page = Number(params.get('page') ?? '1');
  return {
    type: TYPES.includes(type) ? type : 'all',
    tech: params.get('tech'),
    page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
  };
}

/** Filtres des projets dans l'adresse, comme pour l'emploi et les questions. */
export function useProjectFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => parseProjectFilters(params), [params]);

  const update = useCallback(
    (changes: Partial<Record<keyof ProjectFilters, string | number | null>>) => {
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
