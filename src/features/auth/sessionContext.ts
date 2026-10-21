import { createContext } from 'react';
import type { LoginRequest, Me, MeUpdate, RegisterRequest } from '../../api/provisional-types';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export type SessionContextValue = {
  status: SessionStatus;
  user: Me | null;
  login: (body: LoginRequest) => Promise<Me>;
  register: (body: RegisterRequest) => Promise<Me>;
  /** Met à jour le profil du membre connecté (PUT /me) et la session. */
  updateMe: (body: MeUpdate) => Promise<Me>;
  /** Remplace le membre par la version renvoyée par le serveur (photo, comptes liés…). */
  setUser: (me: Me) => Me;
  /** Supprime le compte (AUTH-6) puis ferme la session. */
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
