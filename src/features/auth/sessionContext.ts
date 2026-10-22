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
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
