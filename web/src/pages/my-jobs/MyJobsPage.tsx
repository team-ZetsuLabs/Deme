import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { JobRowsSkeleton } from '../../components/skeleton/JobRowsSkeleton';
import { JobRow } from '../../features/jobs/JobRow';
import { JobsSubnav } from '../../features/jobs/JobsSubnav';
import { jobsApi } from '../../features/jobs/jobsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../jobs/JobsPage.module.css';

/** Offres publiées par le recruteur, tous statuts confondus (JOB-4, JOB-7). */
export default function MyJobsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => jobsApi.mine(page), [page]);
  usePageTitle(t('myJobs.pageTitle'));

  return (
    <>
      <JobsSubnav />
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('myJobs.pageTitle')}</h1>
          <p className={styles.lead}>{t('myJobs.lead')}</p>
        </div>
        <Link to="/jobs/new" className={buttonClass({ variant: 'secondary' })}>
          {t('jobs.publish')}
        </Link>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <JobRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('myJobs.empty')}</StateMessage>
        )}
        {!query.loading &&
          query.data?.items.map((job, i) => <JobRow key={`${job.id}-${i}`} job={job} />)}
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
