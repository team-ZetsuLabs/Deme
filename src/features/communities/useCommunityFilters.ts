import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CommunityFilters, CommunityKindFilter } from './communitiesApi';

const KINDS: CommunityKindFilter[] = ['all', 'COUNTRY', 'TECH'];

/** Filtres des communautés dans l'adresse, comme pour les questions et les offres. */
export function useCommunityFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<CommunityFilters>(() => {
    const kind = params.get('kind') as CommunityKindFilter;
    const page = Number(params.get('page') ?? '1');
    return {
      kind: KINDS.includes(kind) ? kind : 'all',
      q: params.get('q'),
      page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
    };
  }, [params]);

  const update = useCallback(
    (changes: Partial<Record<keyof CommunityFilters, string | number | null>>) => {
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

  return { filters, update };
}
