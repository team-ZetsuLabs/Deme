import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { LoginForm } from '../../features/auth/LoginForm';
import { OAuthButtons } from '../../features/auth/OAuthButtons';
import { RegisterForm } from '../../features/auth/RegisterForm';
import { useSession } from '../../features/auth/useSession';
import { usePageTitle } from '../../hooks/usePageTitle';
import { LanguageSwitcher } from '../../layout/LanguageSwitcher';
import { Logo } from '../../layout/Logo';
import { PageLoader } from '../../layout/PageLoader';
import { ThemeToggle } from '../../layout/ThemeToggle';
import { AuthAside } from './AuthAside';
import styles from './AuthPage.module.css';

export type AuthPageProps = { mode: 'login' | 'register' };

/** Page d'où revenir après connexion, transmise par la page qui a demandé un compte. */
function useReturnTo(): string {
  const { state } = useLocation();
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/questions';
}

/** Connexion (AUTH-3) et inscription (AUTH-1), avec GitHub et Google (AUTH-2). */
export default function AuthPage({ mode }: AuthPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status } = useSession();
  const returnTo = useReturnTo();
  const isRegister = mode === 'register';
  usePageTitle(t(`auth.${mode}.pageTitle`));

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to={returnTo} replace />;

  // Après une inscription, le parcours d'accueil (AUTH-5) remplacera cette destination.
  const onSignedIn = () => navigate(returnTo, { replace: true });

  return (
    <div className={styles.auth}>
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
          <h1 className={styles.title}>{t(`auth.${mode}.title`)}</h1>
          <p className={styles.lead}>{t(`auth.${mode}.lead`)}</p>

          <nav className={styles.tabs} aria-label={t('auth.tabs.label')}>
            <NavLink to="/login" state={{ from: returnTo }} replace>
              {t('auth.tabs.login')}
            </NavLink>
            <NavLink to="/register" state={{ from: returnTo }} replace>
              {t('auth.tabs.register')}
            </NavLink>
          </nav>

          <OAuthButtons mode={mode} onSignedIn={onSignedIn} />
          <p className={styles.or}>{t('auth.or')}</p>

          {isRegister ? (
            <RegisterForm key="register" onSignedIn={onSignedIn} />
          ) : (
            <LoginForm key="login" onSignedIn={onSignedIn} />
          )}

          <p className={styles.switch}>
            {t(`auth.${mode}.switch`)}{' '}
            <Link to={isRegister ? '/login' : '/register'} state={{ from: returnTo }} replace>
              {t(`auth.${mode}.switchLink`)}
            </Link>
          </p>
        </main>
      </div>
      <AuthAside />
    </div>
  );
}
