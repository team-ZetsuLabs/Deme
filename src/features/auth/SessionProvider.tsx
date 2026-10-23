import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRequest, Me, MeUpdate, RegisterRequest } from '../../api/types';
import { api } from '../../api/api';
import { changeLanguage } from '../../i18n';
import { authApi } from './authApi';
import { SessionContext, type SessionStatus } from './sessionContext';

type SessionProviderProps = { children: ReactNode };

/** Session par cookie HttpOnly : le front ne voit jamais de jeton, il demande /auth/me. */
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
  // Un compte qui vient d'être créé passe par le parcours d'accueil (AUTH-5).
  const register = useCallback(
    (body: RegisterRequest) =>
      authApi.register(body).then((me) => signIn({ ...me, onboarded: me.onboarded ?? false })),
    [signIn],
  );
  const updateMe = useCallback(
    async (body: MeUpdate) => {
      if (!user) throw new Error('updateMe sans membre connecté');
      const me = await authApi.updateMe(user, body);
      // Les Extras (stack, parcours d'accueil) ne sont pas encore renvoyés par le serveur : on
      // les garde. En mode mock, la réponse est un fichier fixe : on applique toute la modification.
      const extras = {
        skills: body.skills ?? user.skills,
        onboarded: body.onboarded ?? user.onboarded,
      };
      return signIn(api.mode === 'mock' ? { ...user, ...body } : { ...user, ...me, ...extras });
    },
    [signIn, user],
  );
  const signOutLocally = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);
  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    signOutLocally();
  }, [signOutLocally]);

  const value = useMemo(
    () => ({ status, user, login, register, updateMe, setUser: signIn, logout, deleteAccount }),
    [status, user, login, register, updateMe, signIn, logout, deleteAccount],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
