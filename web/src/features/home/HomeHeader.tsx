import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { LanguageSwitcher } from '../../layout/LanguageSwitcher';
import { Logo } from '../../layout/Logo';
import { ThemeToggle } from '../../layout/ThemeToggle';
import styles from './HomeHeader.module.css';

export function HomeHeader() {
  const { t } = useTranslation();
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo />
        <nav className={styles.nav} aria-label={t('nav.label')}>
          <Link to="/questions">{t('nav.questions')}</Link>
          <Link to="/jobs">{t('nav.jobs')}</Link>
          <Link to="/missions">{t('nav.missions')}</Link>
          <Link to="/challenges">{t('nav.challenges')}</Link>
        </nav>
        <div className={styles.right}>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to="/login" className={buttonClass({ variant: 'secondary' })}>
            {t('topbar.login')}
          </Link>
        </div>
      </div>
    </header>
  );
}
