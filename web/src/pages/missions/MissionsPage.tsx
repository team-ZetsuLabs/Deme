import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { CountrySelect } from '../../components/CountrySelect';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { MissionRowsSkeleton } from '../../components/skeleton/MissionRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { MissionRow } from '../../features/missions/MissionRow';
import { missionsApi, type MissionKindFilter } from '../../features/missions/missionsApi';
import { useMissionFilters } from '../../features/missions/useMissionFilters';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../jobs/JobsPage.module.css';

/** Missions entre pairs (JOB-5), dans leur propre onglet, distinct des offres d'emploi. */
export default function MissionsPage() {
  const { t } = useTranslation();
  const { filters, update, kinds } = useMissionFilters();
  const [tech, setTech] = useState(filters.tech ?? '');
  const query = useApiQuery(() => missionsApi.list(filters), [filters]);
  usePageTitle(t('missions.pageTitle'));

  const onTech = (e: FormEvent) => {
    e.preventDefault();
    update({ tech: tech.trim().toLowerCase() || null });
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('missions.title')}</h1>
          <p className={styles.lead}>{t('missions.lead')}</p>
        </div>
        <Link to="/missions/new" className={buttonClass({ variant: 'primary' })}>
          {t('missions.publish')}
        </Link>
      </div>

      <div className={styles.filters}>
        <Segmented<MissionKindFilter>
          label={t('missions.filters.kind')}
          value={filters.kind}
          onChange={(kind) => update({ kind })}
          options={kinds.map((kind) => ({
            value: kind,
            label: kind === 'all' ? t('questions.filters.all') : t(`missions.kind.${kind}`),
          }))}
        />
        <div className={styles.row}>
          <label className="sr-only" htmlFor="missions-country">
            {t('jobs.filters.country')}
          </label>
          <CountrySelect
            id="missions-country"
            variant="filter"
            value={filters.country ?? ''}
            onChange={(country) => update({ country })}
            emptyLabel={t('questions.filters.anyCountry')}
          />
          <form className={styles.techForm} onSubmit={onTech} role="search">
            <label className="sr-only" htmlFor="missions-tech">
              {t('jobs.filters.tech')}
            </label>
            <input
              id="missions-tech"
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
        {query.loading && <MissionRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage
            action={
              <Link to="/missions/new" className={buttonClass({ variant: 'primary' })}>
                {t('missions.publish')}
              </Link>
            }
          >
            {t('missions.empty')}
          </StateMessage>
        )}
        {!query.loading && query.data?.items.map((m) => <MissionRow key={m.id} mission={m} />)}
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
