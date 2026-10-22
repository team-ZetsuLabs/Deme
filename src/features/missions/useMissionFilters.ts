import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MissionFilters, MissionKindFilter } from './missionsApi';

const KINDS: MissionKindFilter[] = ['all', 'FIX', 'INTEGRATION', 'CODE_REVIEW', 'OTHER'];

/** Filtres des missions dans l'adresse, comme pour les offres. */
export function useMissionFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<MissionFilters>(() => {
    const kind = params.get('kind') as MissionKindFilter;
    const page = Number(params.get('page') ?? '1');
    return {
      kind: KINDS.includes(kind) ? kind : 'all',
      tech: params.get('tech'),
      page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    };
  }, [params]);

  const update = useCallback(
    (changes: Partial<Record<keyof MissionFilters, string | number | null>>) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          const isDefault =
            value === null ||
            value === '' ||
            (key === 'kind' && value === 'all') ||
            (key === 'page' && value === 0);
          if (isDefault) next.delete(key);
          else next.set(key, key === 'page' ? String(Number(value) + 1) : String(value));
        }
        return next;
      });
    },
    [setParams],
  );

  return { filters, update, kinds: KINDS };
}
