import { useTranslation } from 'react-i18next';
import { useSession } from '../../features/auth/useSession';
import { AccountSection } from '../../features/settings/AccountSection';
import { AppearanceSection } from '../../features/settings/AppearanceSection';
import { ConnectedAccounts } from '../../features/settings/ConnectedAccounts';
import { DeleteAccountSection } from '../../features/settings/DeleteAccountSection';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './SettingsPage.module.css';

const SECTIONS = [
  { id: 'account', labelKey: 'settings.account.title' },
  { id: 'connections', labelKey: 'settings.accounts.title' },
  { id: 'appearance', labelKey: 'settings.appearance.title' },
  { id: 'delete', labelKey: 'settings.delete.title' },
] as const;

/**
 * Paramètres du compte et de l'appli (SET-2 à SET-4, AUTH-4, AUTH-6). Le profil public se
 * modifie sur /profile/edit. Réservée aux membres connectés (voir la route).
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  usePageTitle(t('settings.pageTitle'));
  if (!user) return null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.pageTitle')}</h1>
      <p className={styles.lead}>{t('settings.lead')}</p>
      <div className={styles.layout}>
        <nav className={styles.toc} aria-label={t('settings.toc')}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {t(s.labelKey)}
            </a>
          ))}
        </nav>
        <div className={styles.sections}>
          <AccountSection user={user} />
          <ConnectedAccounts user={user} />
          <AppearanceSection />
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
