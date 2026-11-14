import { api } from '../../api/api';
import type {
  AuthProvider,
  Connections,
  LinkStart,
  LoginRequest,
  Me,
  MeUpdate,
  OAuthProviderId,
  OnboardingRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../../api/types';

export type OAuthProvider = OAuthProviderId;

/** Profil complet attendu par PUT /users/me, à partir du membre et des changements. */
export function profileRequest(me: Me, changes: MeUpdate): UpdateProfileRequest {
  return {
    displayName: me.displayName,
    bio: me.bio,
    countryCode: me.countryCode,
    city: me.city,
    language: me.language,
    visibleToRecruiters: me.visibleToRecruiters,
    technologies: me.technologies,
    ...changes,
  };
}

export const authApi = {
  me: () => api.get<Me>('/auth/me'),
  /** Fournisseurs OAuth actifs ; liste vide si le serveur n'a pas le profil oauth. */
  providers: () => api.get<{ providers: AuthProvider[] }>('/auth/providers'),
  login: (body: LoginRequest) => api.post<Me>('/auth/login', body),
  register: (body: RegisterRequest) => api.post<Me>('/auth/register', body),
  logout: () => api.post<void>('/auth/logout'),
  updateMe: (me: Me, changes: MeUpdate) => api.put<Me>('/users/me', profileRequest(me, changes)),
  /** Parcours d'accueil (AUTH-5) : passe onboardingCompleted à vrai. */
  completeOnboarding: (body: OnboardingRequest) => api.put<Me>('/users/me/onboarding', body),
  /** Photo de profil (SET-1) : PNG, JPG ou WebP, 2 Mo au plus, type réel vérifié par le serveur. */
  uploadPhoto: async (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    const me = await api.put<Me>('/users/me/avatar', form);
    // En mode mock, le serveur ne stocke pas le fichier : on affiche la photo choisie
    // localement (URL d'objet) pour pouvoir tester l'écran sans back-end.
    return api.mode === 'mock' ? { ...me, avatarUrl: URL.createObjectURL(file) } : me;
  },
  deletePhoto: () => api.delete<Me>('/users/me/avatar'),
  /** Comptes GitHub et Google liés, et présence d'un mot de passe (SET-4). */
  connections: () => api.get<Connections>('/users/me/connections'),
  /** Commence la liaison : le serveur renvoie l'adresse OAuth, puis revient sur /settings?linked=… */
  link: (provider: OAuthProvider) => api.post<LinkStart>(`/users/me/connections/${provider}`),
  /** Délier GitHub ou Google. 409 LAST_LOGIN_METHOD si c'est le dernier moyen de connexion. */
  unlink: (provider: OAuthProvider) => api.delete<Connections>(`/users/me/connections/${provider}`),
  /**
   * Suppression du compte (AUTH-6) : contenus anonymisés, réputation et candidatures effacées.
   * Le membre recopie son pseudo ; 400 CONFIRMATION_MISMATCH sinon.
   */
  deleteAccount: (confirmation: string) =>
    api.delete<void>('/users/me', { body: { confirmation } }),
  /** Mot de passe oublié (AUTH-4) : 204 que l'adresse existe ou non. */
  requestPasswordReset: (email: string) => api.post<void>('/auth/password-reset', { email }),
  /** Nouveau mot de passe ; 400 RESET_TOKEN_INVALID ou RESET_TOKEN_EXPIRED si le lien est périmé. */
  resetPassword: (token: string, password: string) =>
    api.post<void>('/auth/password-reset/confirm', { token, password }),
  /** Confirme l'adresse ; 400 VERIFY_TOKEN_INVALID ou VERIFY_TOKEN_EXPIRED. */
  verifyEmail: (token: string) => api.post<void>('/auth/verify-email', { token }),
  /** Renvoie l'email de vérification au membre connecté ; 429 RATE_LIMITED au-delà de la limite. */
  resendVerification: () => api.post<void>('/auth/verify-email/resend'),
};
