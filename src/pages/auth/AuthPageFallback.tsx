import { useTranslation } from 'react-i18next';
import { Logo } from '../../layout/Logo';
import { AuthFormSkeleton } from './AuthFormSkeleton';
import styles from './AuthPage.module.css';

export type AuthPageFallbackProps = { mode: 'login' | 'register' };

/**
 * Fallback affiché pendant le chargement du code de la page de compte (Suspense) :
 * le même cadre (logo, titre) avec un squelette aux formes du formulaire, au lieu du
 * squelette générique. Léger, chargé avec l'application pour s'afficher tout de suite.
 */
export function AuthPageFallback({ mode }: AuthPageFallbackProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.auth}>
      <div className={styles.main}>
        <div className={styles.top}>
          <Logo />
        </div>
        <main className={styles.form}>
          <h1 className={styles.title}>{t(`auth.${mode}.title`)}</h1>
          <AuthFormSkeleton />
        </main>
      </div>
    </div>
  );
}
