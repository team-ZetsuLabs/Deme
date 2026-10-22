import { api } from '../../api/api';
import type {
  LoginRequest,
  Me,
  MeUpdate,
  OAuthProviderId,
  RegisterRequest,
} from '../../api/provisional-types';

export type OAuthProvider = OAuthProviderId;

export const authApi = {
  me: () => api.get<Me>('/me'),
  login: (body: LoginRequest) => api.post<Me>('/auth/login', body),
  register: (body: RegisterRequest) => api.post<Me>('/auth/register', body),
  logout: () => api.post<void>('/auth/logout'),
  updateMe: (body: MeUpdate) => api.put<Me>('/me', body),
  /** Photo de profil (SET-1) : PNG, JPG ou WebP, 2 Mo au plus, type réel vérifié par le serveur. */
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post<Me>('/me/photo', form);
  },
  deletePhoto: () => api.delete<Me>('/me/photo'),
  /** Délier GitHub ou Google (SET-4). Refusé par le serveur si c'est le dernier moyen de connexion. */
  unlink: (provider: OAuthProvider) => api.delete<Me>(`/me/connections/${provider}`),
  /** Suppression du compte (AUTH-6) : contenus anonymisés, réputation et candidatures effacées. */
  deleteAccount: () => api.delete<void>('/me'),
};

/**
 * Adresse de départ du flux OAuth. C'est une navigation de page complète,
 * pas un appel fetch. Chemin à confirmer avec le back-end : il doit commencer
 * par /api pour que Caddy le transmette à Spring Boot.
 */
export function oauthUrl(provider: OAuthProvider): string {
  return `/api/oauth2/authorization/${provider}`;
}
