import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/useSession';
import { isRecruiter } from './recruiter';
import styles from './JobsSubnav.module.css';

/** Offres, Mes candidatures et, pour un recruteur, Mes offres : en tête de l'espace Emploi. */
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
      {isRecruiter(user) && (
        <NavLink to="/jobs/mine" className={styles.link}>
          {t('jobs.subnav.mine')}
        </NavLink>
      )}
    </nav>
  );
}
