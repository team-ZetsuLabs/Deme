import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { RelativeTime } from '../../components/RelativeTime';
import { StateMessage } from '../../components/StateMessage';
import { ApplicationStatusBadge } from '../../features/jobs/ApplicationStatusBadge';
import { jobsApi } from '../../features/jobs/jobsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageLoader } from '../../layout/PageLoader';
import styles from './ApplicationsPage.module.css';

/** Suivi de mes candidatures et propositions de mission (JOB-7). */
export default function ApplicationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => jobsApi.myApplications(page), [page]);
  usePageTitle(t('applications.pageTitle'));

  return (
    <>
      <h1 className={styles.title}>{t('applications.pageTitle')}</h1>
      <p className={styles.lead}>{t('applications.lead')}</p>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <PageLoader />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage
            action={
              <Link to="/jobs" className={buttonClass({ variant: 'primary' })}>
                {t('applications.browse')}
              </Link>
            }
          >
            {t('applications.empty')}
          </StateMessage>
        )}
        {!query.loading && query.data && query.data.items.length > 0 && (
          <ul className={styles.list}>
            {query.data.items.map((a) => (
              <li key={a.id} className={styles.item}>
                <div className={styles.body}>
                  <span className={styles.kind}>{t(`applications.kind.${a.targetType}`)}</span>
                  <Link
                    to={a.targetType === 'JOB' ? `/jobs/${a.targetId}` : `/missions/${a.targetId}`}
                  >
                    {a.title}
                  </Link>
                  <small>
                    {a.organisation}
                    <span aria-hidden="true"> · </span>
                    {t('applications.sent')} <RelativeTime iso={a.sentAt} />
                  </small>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={setPage}
        />
      )}
    </>
  );
}
