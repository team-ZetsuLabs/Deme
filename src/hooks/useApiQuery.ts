import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type ApiQuery<T> = {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: () => void;
  /** Remplace les données localement (mise à jour optimiste après un vote, une réponse…). */
  setData: (update: (current: T) => T) => void;
};

/**
 * Charge une ressource et expose les trois états visibles demandés par le CLAUDE.md :
 * chargement, erreur, données (la liste vide est gérée par l'écran).
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: DependencyList): ApiQuery<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (active) setDataState(result);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // fetcher change à chaque rendu : on suit les dépendances fournies par l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback(
    (update: (current: T) => T) => setDataState((current) => (current ? update(current) : current)),
    [],
  );

  return { data, error, loading, reload, setData };
}
