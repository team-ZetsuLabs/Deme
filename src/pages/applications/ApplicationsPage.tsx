import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { RelativeTime } from '../../components/RelativeTime';
import { StateMessage } from '../../components/StateMessage';
import { ApplicationStatusBadge } from '../../features/jobs/ApplicationStatusBadge';
import {
  APPLICATION_STATUSES,
  jobsApi,
  type ApplicationFilters,
} from '../../features/jobs/jobsApi';
import { JobsSubnav } from '../../features/jobs/JobsSubnav';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import styles from './ApplicationsPage.module.css';
import filterStyles from '../jobs/JobsPage.module.css';

const TYPES: ApplicationFilters['type'][] = ['all', 'JOB', 'MISSION'];

/** Suivi de mes candidatures et propositions de mission (JOB-7). */
export default function ApplicationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ApplicationFilters>({ type: 'all', status: 'all' });
  const query = useApiQuery(() => jobsApi.myApplications(page, filters), [page, filters]);
  const filtered = filters.type !== 'all' || filters.status !== 'all';
  const change = (next: Partial<ApplicationFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(0);
  };
  usePageTitle(t('applications.pageTitle'));

  return (
    <>
      <JobsSubnav />
      <h1 className={styles.title}>{t('applications.pageTitle')}</h1>
      <p className={styles.lead}>{t('applications.lead')}</p>

      <div className={filterStyles.filters}>
        <div className={filterStyles.row}>
          <Segmented<ApplicationFilters['type']>
            label={t('applications.filters.type')}
            value={filters.type}
            onChange={(type) => change({ type })}
            options={TYPES.map((type) => ({
              value: type,
              label: t(`applications.filters.types.${type}`),
            }))}
          />
          <label className="sr-only" htmlFor="applications-status">
            {t('applications.filters.status')}
          </label>
          <select
            id="applications-status"
            className={`${filterStyles.input} ${filterStyles.select} ${styles.status}`}
            value={filters.status}
            onChange={(e) => change({ status: e.target.value as ApplicationFilters['status'] })}
          >
            <option value="all">{t('applications.filters.anyStatus')}</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`jobs.status.${status}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <ListRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && filtered && (
          <StateMessage>{t('applications.emptyFiltered')}</StateMessage>
        )}
        {!query.loading && query.data?.items.length === 0 && !filtered && (
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
                  <span className={styles.kind}>{t(`applications.kind.${a.target.type}`)}</span>
                  <Link
                    to={
                      a.target.type === 'JOB' ? `/jobs/${a.target.id}` : `/missions/${a.target.id}`
                    }
                  >
                    {a.target.title}
                  </Link>
                  <small>
                    {a.target.companyName && (
                      <>
                        {a.target.companyName}
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {t('applications.sent')} <RelativeTime iso={a.createdAt} />
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
