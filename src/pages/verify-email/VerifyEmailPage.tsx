import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { buttonClass } from '../../components/buttonClass';
import { LoadingRegion } from '../../components/skeleton/LoadingRegion';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { authApi } from '../../features/auth/authApi';
import { ResendVerificationButton } from '../../features/auth/ResendVerificationButton';
import { useSession } from '../../features/auth/useSession';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AuthShell } from '../auth/AuthShell';
import styles from '../auth/AuthPage.module.css';

const MISSING_TOKEN = new ApiError(400, {
  code: 'VERIFY_TOKEN_INVALID',
  message: 'Lien incomplet',
});

/** Confirmation de l'adresse email par le lien reçu (AUTH-4). */
export default function VerifyEmailPage() {
  const { t } = useTranslation();
  usePageTitle(t('verifyEmail.pageTitle'));
  const { user, setUser } = useSession();
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const query = useApiQuery(
    () => (token ? authApi.verifyEmail(token) : Promise.reject(MISSING_TOKEN)),
    [token],
  );
  const verified = !query.loading && !query.error;

  // La session connaît désormais une adresse confirmée : le bandeau disparaît.
  const updated = useRef(false);
  useEffect(() => {
    if (verified && user && user.emailVerified === false && !updated.current) {
      updated.current = true;
      setUser({ ...user, emailVerified: true });
    }
  }, [verified, user, setUser]);

  if (query.loading) {
    return (
      <AuthShell title={t('verifyEmail.checking')}>
        <LoadingRegion className={styles.spaced}>
          <Skeleton height={14} />
          <Skeleton width="60%" height={14} />
          <Skeleton width={180} height={40} radius="md" />
        </LoadingRegion>
      </AuthShell>
    );
  }

  if (query.error) {
    const dead =
      query.error instanceof ApiError &&
      ['VERIFY_TOKEN_INVALID', 'VERIFY_TOKEN_EXPIRED'].includes(query.error.code);
    return (
      <AuthShell title={t('verifyEmail.failedTitle')}>
        <p className={styles.lead} role="alert">
          {dead ? t('verifyEmail.deadText') : errorMessage(t, query.error)}
        </p>
        <div className={styles.spaced}>
          {user ? (
            <ResendVerificationButton />
          ) : (
            <Link to="/login" className={buttonClass({ variant: 'primary' })}>
              {t('verifyEmail.login')}
            </Link>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('verifyEmail.doneTitle')} lead={t('verifyEmail.doneText')}>
      <div className={styles.spaced} role="status">
        <Link to="/questions" className={buttonClass({ variant: 'primary' })}>
          {t('verifyEmail.continue')}
        </Link>
      </div>
    </AuthShell>
  );
}
