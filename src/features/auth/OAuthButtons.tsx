import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/api';
import { buttonClass, spinnerClass } from '../../components/buttonClass';
import { Icon } from '../../components/Icon';
import { oauthUrl, type OAuthProvider } from './authApi';
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

/** Connexion GitHub et Google (AUTH-2) : redirection complète vers le back-end. */
export function OAuthButtons({ mode, onSignedIn }: OAuthButtonsProps) {
  const { t } = useTranslation();
  const { login } = useSession();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const onClick = async (e: MouseEvent, provider: OAuthProvider) => {
    setPending(provider);
    // En mode mock, pas de serveur OAuth : on simule une connexion réussie.
    if (api.mode === 'mock') {
      e.preventDefault();
      await login({ email: '', password: '' });
      onSignedIn();
    }
  };

  return (
    <div className={styles.oauth}>
      {PROVIDERS.map(({ id, variant }) => (
        <a
          key={id}
          href={oauthUrl(id)}
          className={`${buttonClass({ variant, block: true })} ${styles.oauthBtn}`}
          aria-busy={pending === id || undefined}
          onClick={(e) => onClick(e, id)}
        >
          {pending === id ? (
            <span className={spinnerClass} aria-hidden="true" />
          ) : (
            <Icon name={id} size={18} />
          )}
          {t(`auth.oauth.${id}${mode === 'register' ? 'Register' : ''}`)}
        </a>
      ))}
    </div>
  );
}
