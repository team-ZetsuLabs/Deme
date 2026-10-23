import { useApiQuery } from '../../hooks/useApiQuery';
import { authApi, type OAuthProvider } from './authApi';

export type OAuthProviders = {
  loading: boolean;
  /** Adresse de départ de chaque fournisseur actif ; absent si le serveur ne le propose pas. */
  urls: Partial<Record<OAuthProvider, string>>;
};

/**
 * Fournisseurs OAuth actifs (GET /auth/providers). On navigue vers authorizationUrl :
 * c'est une redirection de page complète, pas un appel fetch.
 */
export function useOAuthProviders(): OAuthProviders {
  const query = useApiQuery(() => authApi.providers(), []);
  const urls: Partial<Record<OAuthProvider, string>> = {};
  for (const p of query.data?.providers ?? []) {
    // Seules les adresses du même site sont suivies (pas de redirection ouverte).
    if ((p.id === 'github' || p.id === 'google') && p.authorizationUrl.startsWith('/')) {
      urls[p.id] = p.authorizationUrl;
    }
  }
  return { loading: query.loading, urls };
}
