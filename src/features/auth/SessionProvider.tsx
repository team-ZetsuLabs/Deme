import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, Me, RegisterRequest } from '../../api/provisional-types';
import { changeLanguage } from '../../i18n';
import { authApi } from './authApi';
import { SessionContext, type SessionStatus } from './sessionContext';

type SessionProviderProps = { children: ReactNode };

/** Session par cookie HttpOnly : le front ne voit jamais de jeton, il demande /me. */
export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((me) => {
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // 401 attendu quand personne n'est connecté (ou exemple absent en mode mock)
        if (active) setStatus('anonymous');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((me: Me) => {
    setUser(me);
    setStatus('authenticated');
    void changeLanguage(me.language);
    return me;
  }, []);

  const login = useCallback((body: LoginRequest) => authApi.login(body).then(signIn), [signIn]);
  const register = useCallback(
    (body: RegisterRequest) => authApi.register(body).then(signIn),
    [signIn],
  );
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
