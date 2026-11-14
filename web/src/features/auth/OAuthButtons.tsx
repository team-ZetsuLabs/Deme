import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/api';
import { buttonClass, spinnerClass } from '../../components/buttonClass';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { type OAuthProvider } from './authApi';
import { useOAuthProviders } from './useOAuthProviders';
import { useSession } from './useSession';
import styles from './AuthForm.module.css';

export type OAuthButtonsProps = {
  mode: 'login' | 'register';
  onSignedIn: () => void;
};

const PROVIDERS: { id: OAuthProvider; variant: 'dark' | 'secondary' }[] = [
  { id: 'github', variant: 'dark' },
  { id: 'google', variant: 'secondary' },
];

/**
 * Connexion GitHub et Google (AUTH-2) : redirection complète vers le back-end.
 * Sans fournisseur actif côté serveur, rien n'est affiché et l'email reste seul.
 */
export function OAuthButtons({ mode, onSignedIn }: OAuthButtonsProps) {
  const { t } = useTranslation();
  const { login } = useSession();
  const { loading, urls } = useOAuthProviders();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const active = PROVIDERS.filter(({ id }) => urls[id]);

  const onClick = async (e: MouseEvent, provider: OAuthProvider) => {
    setPending(provider);
    // En mode mock, pas de serveur OAuth : on simule une connexion réussie.
    if (api.mode === 'mock') {
      e.preventDefault();
      await login({ email: '', password: '' });
      onSignedIn();
    }
  };

  if (loading) {
    return (
      <div className={styles.oauth} aria-hidden="true">
        <Skeleton height={44} radius="md" />
        <Skeleton height={44} radius="md" />
      </div>
    );
  }
  if (!active.length) return null;

  return (
    <>
      <div className={styles.oauth}>
        {active.map(({ id, variant }) => (
          <a
            key={id}
            href={urls[id]}
            className={`${buttonClass({ variant, block: true })} ${styles.oauthBtn}`}
            aria-busy={pending === id || undefined}
            aria-label={t(`auth.oauth.${id}${mode === 'register' ? 'Register' : ''}`)}
            onClick={(e) => onClick(e, id)}
          >
            {pending === id ? (
              <span className={spinnerClass} aria-hidden="true" />
            ) : (
              <Icon name={id} size={18} />
            )}
            {id === 'github' ? 'GitHub' : 'Google'}
          </a>
        ))}
      </div>
      <p className={styles.or}>{t('auth.or')}</p>
    </>
  );
}
