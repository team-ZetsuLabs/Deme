import { api } from '../../api/api';
import type { LoginRequest, Me, MeUpdate, RegisterRequest } from '../../api/provisional-types';

export type OAuthProvider = 'github' | 'google';

export const authApi = {
  me: () => api.get<Me>('/me'),
  login: (body: LoginRequest) => api.post<Me>('/auth/login', body),
  register: (body: RegisterRequest) => api.post<Me>('/auth/register', body),
  logout: () => api.post<void>('/auth/logout'),
  updateMe: (body: MeUpdate) => api.put<Me>('/me', body),
};

/**
 * Adresse de départ du flux OAuth. C'est une navigation de page complète,
 * pas un appel fetch. Chemin à confirmer avec le back-end : il doit commencer
 * par /api pour que Caddy le transmette à Spring Boot.
 */
export function oauthUrl(provider: OAuthProvider): string {
  return `/api/oauth2/authorization/${provider}`;
}
