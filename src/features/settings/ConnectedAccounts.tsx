import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me } from '../../api/provisional-types';
import { api } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/useToast';
import { authApi, oauthUrl, type OAuthProvider } from '../auth/authApi';
import { useSession } from '../auth/useSession';
import styles from './ConnectedAccounts.module.css';
import settings from './Settings.module.css';

const PROVIDERS: { id: OAuthProvider; name: string }[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
];

export type ConnectedAccountsProps = { user: Me };

/** Lier ou délier GitHub et Google (SET-4). */
export function ConnectedAccounts({ user }: ConnectedAccountsProps) {
  const { t } = useTranslation();
  const { setUser } = useSession();
  const toast = useToast();
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const unlink = async (provider: OAuthProvider) => {
    setPending(provider);
    try {
      setUser(await authApi.unlink(provider));
      toast(t('settings.accounts.unlinked'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  return (
    <section className={settings.section} aria-labelledby="settings-accounts-title">
      <h2 id="settings-accounts-title" className={settings.title}>
        {t('settings.accounts.title')}
      </h2>
      <p className={settings.intro}>{t('settings.accounts.intro')}</p>
      <ul className={styles.list}>
        {PROVIDERS.map(({ id, name }) => {
          const linked = user.providers.includes(id);
          // Délier le dernier moyen de connexion bloquerait le compte : le serveur le refuse aussi.
          const lastMethod = linked && !user.hasPassword && user.providers.length === 1;
          return (
            <li key={id} className={styles.row}>
              <Icon name={id} size={22} />
              <div className={styles.info}>
                <b>{name}</b>
                <span>
                  {linked ? t('settings.accounts.linked') : t('settings.accounts.notLinked')}
                </span>
                {lastMethod && <span>{t('settings.accounts.lastMethod')}</span>}
              </div>
              {linked ? (
                <Button
                  size="sm"
                  busy={pending === id}
                  disabled={lastMethod}
                  onClick={() => unlink(id)}
                  aria-label={t('settings.accounts.unlinkLabel', { name })}
                >
                  {t('settings.accounts.unlink')}
                </Button>
              ) : (
                <a
                  href={oauthUrl(id)}
                  className={buttonClass({ size: 'sm' })}
                  aria-label={t('settings.accounts.linkLabel', { name })}
                  onClick={(e) => {
                    // En mode mock, pas de serveur OAuth : on ne quitte pas la page.
                    if (api.mode === 'mock') {
                      e.preventDefault();
                      toast(t('settings.accounts.mockOnly'));
                    }
                  }}
                >
                  {t('settings.accounts.link')}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
