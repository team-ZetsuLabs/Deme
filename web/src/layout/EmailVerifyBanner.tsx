import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { ResendVerificationButton } from '../features/auth/ResendVerificationButton';
import { useSession } from '../features/auth/useSession';
import styles from './EmailVerifyBanner.module.css';

// Fermeture mémorisée le temps de l'onglet : le rappel revient à la prochaine visite
// tant que l'adresse n'est pas confirmée, mais on peut l'écarter quand il gêne.
const CLOSED_KEY = 'zetsu.verifyBannerClosed';

function readClosed(): boolean {
  try {
    return sessionStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Rappel tant que l'adresse email n'est pas confirmée (AUTH-4), que l'on peut fermer. */
export function EmailVerifyBanner() {
  const { t } = useTranslation();
  const { user } = useSession();
  const [closed, setClosed] = useState(readClosed);
  if (!user || user.emailVerified !== false || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(CLOSED_KEY, '1');
    } catch {
      // Stockage indisponible (navigation privée) : la fermeture tient en mémoire pour la session.
    }
  };

  return (
    <div className={styles.banner}>
      <p>{t('verifyEmail.banner', { email: user.email })}</p>
      <ResendVerificationButton size="sm" />
      <button type="button" className={styles.close} onClick={close} aria-label={t('common.close')}>
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
