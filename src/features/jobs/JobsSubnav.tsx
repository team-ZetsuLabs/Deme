import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/useSession';
import styles from './JobsSubnav.module.css';

/** Offres et Mes candidatures, en tête des deux pages de l'espace Emploi (membres connectés). */
export function JobsSubnav() {
  const { t } = useTranslation();
  const { user } = useSession();
  if (!user) return null;
  return (
    <nav className={styles.subnav} aria-label={t('jobs.subnav.label')}>
      <NavLink to="/jobs" end className={styles.link}>
        {t('jobs.subnav.offers')}
      </NavLink>
      <NavLink to="/applications" className={styles.link}>
        {t('nav.applications')}
      </NavLink>
    </nav>
  );
}
