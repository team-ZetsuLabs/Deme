import { createContext } from 'react';
import type { LoginRequest, Me, MeUpdate, RegisterRequest } from '../../api/types';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export type SessionContextValue = {
  status: SessionStatus;
  user: Me | null;
  login: (body: LoginRequest) => Promise<Me>;
  register: (body: RegisterRequest) => Promise<Me>;
  /** Met à jour le profil du membre connecté (PUT /me) et la session. */
  updateMe: (body: MeUpdate) => Promise<Me>;
  /** Remplace le membre par la version renvoyée par le serveur (photo, parcours d'accueil…). */
  setUser: (me: Me) => Me;
  /** Le membre remet le parcours d'accueil à plus tard : on ne le lui redemande pas avant sa prochaine visite. */
  onboardingSkipped: boolean;
  skipOnboarding: () => void;
  /** Supprime le compte (AUTH-6) puis ferme la session. Le pseudo recopié sert de confirmation. */
  deleteAccount: (confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
