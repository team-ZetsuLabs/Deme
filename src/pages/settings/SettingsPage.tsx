import { useTranslation } from 'react-i18next';
import { useSession } from '../../features/auth/useSession';
import { AppearanceSection } from '../../features/settings/AppearanceSection';
import { ConnectedAccounts } from '../../features/settings/ConnectedAccounts';
import { DeleteAccountSection } from '../../features/settings/DeleteAccountSection';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './SettingsPage.module.css';

/** Paramètres du compte et de l'appli (SET-2 à SET-4, AUTH-6) ; le profil public est sur /profile/edit. Réservée aux membres connectés (voir la route). */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  usePageTitle(t('settings.pageTitle'));
  if (!user) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.pageTitle')}</h1>
      <ConnectedAccounts user={user} />
      <AppearanceSection />
      <DeleteAccountSection />
    </div>
  );
}
