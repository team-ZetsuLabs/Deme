import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Logo.module.css';

export function Logo() {
  const { t } = useTranslation();
  return (
    <Link to="/" className={styles.logo} aria-label={t('app.home')}>
      <span className={styles.mark} aria-hidden="true" />
      zetsu
    </Link>
  );
}
