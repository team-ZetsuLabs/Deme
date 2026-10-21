import { createContext } from 'react';
import type { LoginRequest, Me, RegisterRequest } from '../../api/provisional-types';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

export type SessionContextValue = {
  status: SessionStatus;
  user: Me | null;
  login: (body: LoginRequest) => Promise<Me>;
  register: (body: RegisterRequest) => Promise<Me>;
  logout: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
