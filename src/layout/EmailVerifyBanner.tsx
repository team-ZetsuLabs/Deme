import { useTranslation } from 'react-i18next';
import { ResendVerificationButton } from '../features/auth/ResendVerificationButton';
import { useSession } from '../features/auth/useSession';
import styles from './EmailVerifyBanner.module.css';

/** Rappel tant que l'adresse email n'est pas confirmée (AUTH-4). */
export function EmailVerifyBanner() {
  const { t } = useTranslation();
  const { user } = useSession();
  if (!user || user.emailVerified !== false) return null;
  return (
    <div className={styles.banner}>
      <p>{t('verifyEmail.banner', { email: user.email })}</p>
      <ResendVerificationButton size="sm" />
    </div>
  );
}
