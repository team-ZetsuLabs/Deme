import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { Connections } from '../../api/types';
import { api } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { useToast } from '../../components/useToast';
import { authApi, type OAuthProvider } from '../auth/authApi';
import { useOAuthProviders } from '../auth/useOAuthProviders';
import styles from './ConnectedAccounts.module.css';
import settings from './Settings.module.css';

const PROVIDERS: { id: OAuthProvider; name: string }[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
];

export type ConnectedAccountsProps = {
  /** null pendant le chargement. */
  connections: Connections | null;
  onChange: (connections: Connections) => void;
};

/** Lier ou délier GitHub et Google (SET-4). */
export function ConnectedAccounts({ connections, onChange }: ConnectedAccountsProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const { urls } = useOAuthProviders();
  const [params, setParams] = useSearchParams();

  // Retour de GitHub ou Google : le serveur renvoie vers /settings?linked=… ou ?linkError=…
  const linked = params.get('linked');
  const linkError = params.get('linkError');
  useEffect(() => {
    if (!linked && !linkError) return;
    toast(
      linkError
        ? t(`errors.${linkError}`, { defaultValue: t('errors.UNKNOWN_ERROR') })
        : t('settings.accounts.linkedNow'),
    );
    setParams({}, { replace: true });
  }, [linked, linkError, setParams, t, toast]);

  const link = async (provider: OAuthProvider) => {
    // En mode mock, pas de serveur OAuth : on ne quitte pas la page.
    if (api.mode === 'mock') {
      toast(t('settings.accounts.mockOnly'));
      return;
    }
    setPending(provider);
    try {
      const { authorizationUrl } = await authApi.link(provider);
      // Seules les adresses du même site sont suivies (pas de redirection ouverte).
      if (!authorizationUrl.startsWith('/') || authorizationUrl.startsWith('//')) {
        throw new Error('authorizationUrl hors du site');
      }
      window.location.assign(authorizationUrl);
    } catch (error) {
      toast(errorMessage(t, error));
      setPending(null);
    }
  };

  const unlink = async (provider: OAuthProvider) => {
    setPending(provider);
    try {
      onChange(await authApi.unlink(provider));
      toast(t('settings.accounts.unlinked'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  return (
    <section
      id="connections"
      className={settings.section}
      aria-labelledby="settings-accounts-title"
    >
      <h2 id="settings-accounts-title" className={settings.title}>
        {t('settings.accounts.title')}
      </h2>
      <p className={settings.intro}>{t('settings.accounts.intro')}</p>
      {!connections ? (
        <ListRowsSkeleton count={2} />
      ) : (
        <ul className={styles.list}>
          {PROVIDERS.map(({ id, name }) => {
            const account = connections.accounts.find((a) => a.provider === id);
            const isLinked = account?.linked ?? false;
            // Délier le dernier moyen de connexion bloquerait le compte : le serveur le refuse.
            const lastMethod = isLinked && account?.canUnlink === false;
            return (
              <li key={id} className={styles.row}>
                <Icon name={id} size={22} />
                <div className={styles.info}>
                  <b>{name}</b>
                  <span>
                    {isLinked ? t('settings.accounts.linked') : t('settings.accounts.notLinked')}
                  </span>
                  {lastMethod && <span>{t('settings.accounts.lastMethod')}</span>}
                </div>
                {isLinked ? (
                  <Button
                    size="sm"
                    busy={pending === id}
                    disabled={lastMethod}
                    onClick={() => unlink(id)}
                    aria-label={t('settings.accounts.unlinkLabel', { name })}
                  >
                    {t('settings.accounts.unlink')}
                  </Button>
                ) : urls[id] || api.mode === 'mock' ? (
                  <Button
                    size="sm"
                    busy={pending === id}
                    onClick={() => link(id)}
                    aria-label={t('settings.accounts.linkLabel', { name })}
                  >
                    {t('settings.accounts.link')}
                  </Button>
                ) : (
                  <span className={styles.unavailable}>{t('settings.accounts.unavailable')}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
