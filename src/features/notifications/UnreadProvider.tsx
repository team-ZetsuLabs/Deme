import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSession } from '../auth/useSession';
import { notificationsApi } from './notificationsApi';
import { UnreadContext } from './unreadContext';

/** Toutes les 2 minutes, seulement quand l'onglet est visible : léger sur un forfait 3G. */
const REFRESH_MS = 2 * 60 * 1000;

type UnreadProviderProps = { children: ReactNode };

export function UnreadProvider({ children }: UnreadProviderProps) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const [count, setCountState] = useState(0);

  const refresh = useCallback(() => {
    if (userId === null) return;
    notificationsApi
      .unreadCount()
      .then((result) => setCountState(result.count))
      .catch(() => {
        // Le compteur est un confort : en cas d'erreur, on garde la dernière valeur.
      });
  }, [userId]);

  useEffect(() => {
    if (userId === null) {
      setCountState(0);
      return;
    }
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, refresh]);

  const setCount = useCallback(
    (update: (current: number) => number) => setCountState((c) => Math.max(0, update(c))),
    [],
  );

  const value = useMemo(() => ({ count, refresh, setCount }), [count, refresh, setCount]);
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}
