import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { ProfileForm } from '../../features/profile/ProfileForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './ProfileEditPage.module.css';

/**
 * Modifier mon profil (SET-1) : ce que les autres voient. Les réglages du compte et de
 * l'appli restent dans les Paramètres. Réservée aux membres connectés (voir la route).
 */
export default function ProfileEditPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('profileEdit.pageTitle'));
  if (!user) return null;
  const profileUrl = `/users/${user.username}`;

  return (
    <div className={styles.page}>
      <Link to={profileUrl} className={styles.back}>
        {t('profileEdit.back')}
      </Link>
      <h1 className={styles.title}>{t('profileEdit.pageTitle')}</h1>
      <p className={styles.lead}>{t('profileEdit.lead')}</p>
      <ProfileForm
        key={user.id}
        user={user}
        onSaved={() => {
          toast(t('profileEdit.saved'));
          navigate(profileUrl);
        }}
      />
    </div>
  );
}
