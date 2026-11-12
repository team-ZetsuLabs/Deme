import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, Me, MeUpdate, RegisterRequest } from '../../api/types';
import { api } from '../../api/api';
import { changeLanguage } from '../../i18n';
import { authApi } from './authApi';
import { setAuthHint } from './authHint';
import { SessionContext, type SessionStatus } from './sessionContext';

type SessionProviderProps = { children: ReactNode };

/** Session par cookie HttpOnly : le front ne voit jamais de jeton, il demande /auth/me. */
export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((me) => {
        setAuthHint(true);
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // 401 attendu quand personne n'est connecté (ou exemple absent en mode mock)
        setAuthHint(false);
        if (active) setStatus('anonymous');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((me: Me) => {
    setAuthHint(true);
    setUser(me);
    setStatus('authenticated');
    void changeLanguage(me.language);
    return me;
  }, []);

  const login = useCallback((body: LoginRequest) => authApi.login(body).then(signIn), [signIn]);
  // Un compte qui vient d'être créé a onboardingCompleted à faux : il passe par /welcome (AUTH-5).
  const register = useCallback(
    (body: RegisterRequest) => authApi.register(body).then(signIn),
    [signIn],
  );
  const updateMe = useCallback(
    async (body: MeUpdate) => {
      if (!user) throw new Error('updateMe sans membre connecté');
      const me = await authApi.updateMe(user, body);
      // En mode mock, la réponse est un fichier fixe : on applique toute la modification.
      return signIn(
        api.mode === 'mock'
          ? { ...user, ...body, technologies: body.technologies ?? user.technologies }
          : { ...user, ...me },
      );
    },
    [signIn, user],
  );
  const signOutLocally = useCallback(() => {
    setAuthHint(false);
    setUser(null);
    setStatus('anonymous');
    setOnboardingSkipped(false);
  }, []);
  const skipOnboarding = useCallback(() => setOnboardingSkipped(true), []);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);
  const deleteAccount = useCallback(
    async (confirmation: string) => {
      await authApi.deleteAccount(confirmation);
      signOutLocally();
    },
    [signOutLocally],
  );

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      register,
      updateMe,
      setUser: signIn,
      onboardingSkipped,
      skipOnboarding,
      logout,
      deleteAccount,
    }),
    [
      status,
      user,
      login,
      register,
      updateMe,
      signIn,
      onboardingSkipped,
      skipOnboarding,
      logout,
      deleteAccount,
    ],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
