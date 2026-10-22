import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { LanguageSwitcher } from '../../layout/LanguageSwitcher';
import { Logo } from '../../layout/Logo';
import { ThemeToggle } from '../../layout/ThemeToggle';
import { AuthAside } from './AuthAside';
import styles from './AuthPage.module.css';

export type AuthShellProps = {
  title: string;
  lead?: string;
  children: ReactNode;
};

/** Cadre des pages de compte : connexion, inscription, mot de passe, vérification de l'email. */
export function AuthShell({ title, lead, children }: AuthShellProps) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.auth} page-enter`}>
      <div className={styles.main}>
        <div className={styles.top}>
          <Logo />
          <div className={styles.topRight}>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              to="/questions"
              className={`${buttonClass({ variant: 'ghost' })} ${styles.browse}`}
            >
              {t('auth.browse')}
            </Link>
          </div>
        </div>

        <main id="main" className={styles.form}>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
          {children}
        </main>
      </div>
      <AuthAside />
    </div>
  );
}
