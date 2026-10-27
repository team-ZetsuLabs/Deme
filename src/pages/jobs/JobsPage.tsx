import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { StateMessage } from '../../components/StateMessage';
import { JobRow } from '../../features/jobs/JobRow';
import { jobsApi, type JobTypeFilter } from '../../features/jobs/jobsApi';
import { useJobFilters } from '../../features/jobs/useJobFilters';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { JobRowsSkeleton } from '../../components/skeleton/JobRowsSkeleton';
import styles from './JobsPage.module.css';

const TYPES: JobTypeFilter[] = ['all', 'FULL_TIME', 'REMOTE', 'CONTRACT', 'INTERNSHIP'];

/** Offres d'emploi filtrables par type, pays et technologie (JOB-1). */
export default function JobsPage() {
  const { t } = useTranslation();
  const { filters, update } = useJobFilters();
  const [tech, setTech] = useState(filters.tech ?? '');
  const query = useApiQuery(() => jobsApi.list(filters), [filters]);
  usePageTitle(t('jobs.pageTitle'));

  const onTech = (e: FormEvent) => {
    e.preventDefault();
    update({ tech: tech.trim().toLowerCase() || null });
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('jobs.title')}</h1>
          <p className={styles.lead}>{t('jobs.lead')}</p>
        </div>
        <Link to="/jobs/new" className={buttonClass({ variant: 'secondary' })}>
          {t('jobs.publish')}
        </Link>
      </div>

      <div className={styles.filters}>
        <Segmented<JobTypeFilter>
          label={t('jobs.filters.type')}
          value={filters.type}
          onChange={(type) => update({ type })}
          options={TYPES.map((type) => ({ value: type, label: t(`jobs.filters.types.${type}`) }))}
        />
        <div className={styles.row}>
          <label className="sr-only" htmlFor="jobs-country">
            {t('jobs.filters.country')}
          </label>
          <CountrySelect
            id="jobs-country"
            variant="filter"
            value={filters.country ?? ''}
            onChange={(country) => update({ country })}
            emptyLabel={t('questions.filters.anyCountry')}
          />
          <form className={styles.techForm} onSubmit={onTech} role="search">
            <label className="sr-only" htmlFor="jobs-tech">
              {t('jobs.filters.tech')}
            </label>
            <input
              id="jobs-tech"
              className={styles.input}
              value={tech}
              placeholder={t('jobs.filters.techPlaceholder')}
              autoCapitalize="none"
              onChange={(e) => setTech(e.target.value)}
            />
            <Button type="submit" size="sm">
              {t('jobs.filters.apply')}
            </Button>
          </form>
        </div>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <JobRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('jobs.empty')}</StateMessage>
        )}
        {!query.loading && query.data?.items.map((job) => <JobRow key={job.id} job={job} />)}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={(page) => {
            update({ page });
            window.scrollTo(0, 0);
          }}
        />
      )}
    </>
  );
}
