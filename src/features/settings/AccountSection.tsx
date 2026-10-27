import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Me } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { useToast } from '../../components/useToast';
import { authApi } from '../auth/authApi';
import { ResendVerificationButton } from '../auth/ResendVerificationButton';
import styles from './Settings.module.css';
import account from './AccountSection.module.css';

export type AccountSectionProps = { user: Me };

/**
 * Email et mot de passe. Le contrat n'a pas de changement de mot de passe connecté : on envoie
 * le lien de réinitialisation à l'adresse du compte, ce qui prouve aussi qu'on la possède.
 */
export function AccountSection({ user }: AccountSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const email = user.email ?? null;

  const sendPasswordLink = async () => {
    if (!email) return;
    setBusy(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
      toast(t('settings.account.passwordSent', { email }));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="account" className={styles.section} aria-labelledby="settings-account-title">
      <h2 id="settings-account-title" className={styles.title}>
        {t('settings.account.title')}
      </h2>
      <p className={styles.intro}>{t('settings.account.intro')}</p>

      <div className={account.row}>
        <div className={account.text}>
          <b>{t('settings.account.email')}</b>
          <span className={account.value}>{email ?? '–'}</span>
          {user.emailVerified === false && (
            <span className={account.warn}>{t('settings.account.unverified')}</span>
          )}
        </div>
        {user.emailVerified === false && <ResendVerificationButton size="sm" />}
      </div>

      <div className={account.row}>
        <div className={account.text}>
          <b>{t('settings.account.password')}</b>
          <span>
            {user.hasPassword === false
              ? t('settings.account.noPassword')
              : t('settings.account.passwordHint')}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          busy={busy}
          disabled={sent || !email}
          onClick={sendPasswordLink}
        >
          {sent
            ? t('settings.account.passwordSentShort')
            : user.hasPassword === false
              ? t('settings.account.setPassword')
              : t('settings.account.changePassword')}
        </Button>
      </div>
    </section>
  );
}
