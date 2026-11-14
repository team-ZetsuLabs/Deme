import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ApiError } from '../api/api';

export type ApiQuery<T> = {
  data: T | null;
  error: unknown;
  loading: boolean;
  reload: () => void;
  /** Remplace les données localement (mise à jour optimiste après un vote, une réponse…). */
  setData: (update: (current: T) => T) => void;
};

const isNetworkError = (err: unknown) => err instanceof ApiError && err.code === 'NETWORK_ERROR';

/**
 * Charge une ressource et expose les trois états visibles demandés par le CLAUDE.md :
 * chargement, erreur, données (la liste vide est gérée par l'écran).
 *
 * Lié à la connexion : hors ligne, l'écran reste en chargement (squelette et message)
 * au lieu d'afficher une erreur, et la requête repart dès le retour du réseau.
 * Une erreur réseau affichée est aussi relancée automatiquement au retour du réseau.
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: DependencyList): ApiQuery<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [offlineWait, setOfflineWait] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setOfflineWait(false);
    fetcher()
      .then((result) => {
        if (!active) return;
        setDataState(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        // Hors ligne : on garde l'écran de chargement, la reprise se fait sur l'événement online.
        if (isNetworkError(err) && !navigator.onLine) {
          setOfflineWait(true);
          return;
        }
        setError(err);
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // fetcher change à chaque rendu : on suit les dépendances fournies par l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  // Retour du réseau : on relance ce qui attendait la connexion ou a échoué faute de réseau.
  const waitingForNetwork = offlineWait || isNetworkError(error);
  useEffect(() => {
    if (!waitingForNetwork) return;
    const onOnline = () => setAttempt((n) => n + 1);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [waitingForNetwork]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback(
    (update: (current: T) => T) => setDataState((current) => (current ? update(current) : current)),
    [],
  );

  return { data, error, loading, reload, setData };
}
