import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.about}>{t('footer.about')}</p>
        <nav className={styles.links} aria-label={t('footer.label')}>
          <Link to="/rules">{t('footer.rules')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
        </nav>
      </div>
    </footer>
  );
}
