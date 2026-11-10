import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { StateMessage } from '../../components/StateMessage';
import { MissionRowsSkeleton } from '../../components/skeleton/MissionRowsSkeleton';
import { PlaytestCard } from '../../features/playtests/PlaytestCard';
import {
  playtestsApi,
  type PlaytestAvailabilityFilter,
  type PlaytestListFilter,
} from '../../features/playtests/playtestsApi';
import { useSession } from '../../features/auth/useSession';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import jobStyles from '../jobs/JobsPage.module.css';
import styles from './PlaytestsPage.module.css';

/** Tests fermés Google Play (TST-1) : trouver des testeurs, tester les applis des autres. */
export default function PlaytestsPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const [status, setStatus] = useState<PlaytestListFilter>('ACTIVE');
  const [availability, setAvailability] = useState<PlaytestAvailabilityFilter>('all');
  const [page, setPage] = useState(0);
  const query = useApiQuery(
    () => playtestsApi.list({ status, availability, page }),
    [status, availability, page],
  );
  usePageTitle(t('playtests.pageTitle'));

  return (
    <>
      <div className={jobStyles.head}>
        <div>
          <h1 className={jobStyles.title}>{t('playtests.title')}</h1>
          <p className={jobStyles.lead}>{t('playtests.lead')}</p>
        </div>
        {user && (
          <Link to="/playtests/new" className={buttonClass({ variant: 'primary' })}>
            {t('playtests.publish')}
          </Link>
        )}
      </div>

      <p className={styles.note}>{t('playtests.disclaimer')}</p>

      <div className={jobStyles.filters}>
        <Segmented<PlaytestListFilter>
          label={t('playtests.filters.status')}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={[
            { value: 'ACTIVE', label: t('playtests.filters.active') },
            { value: 'COMPLETED', label: t('playtests.filters.completed') },
          ]}
        />
        <Segmented<PlaytestAvailabilityFilter>
          label={t('playtests.filters.availability')}
          value={availability}
          onChange={(v) => {
            setAvailability(v);
            setPage(0);
          }}
          options={[
            { value: 'all', label: t('questions.filters.all') },
            { value: 'OPEN', label: t('playtests.filters.open') },
            { value: 'FULL', label: t('playtests.filters.full') },
          ]}
        />
        {user && (
          <Link to="/playtests/mine" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
            {t('playtests.mine')}
          </Link>
        )}
      </div>

      <div className={jobStyles.panel} aria-busy={query.loading}>
        {query.loading && <MissionRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage
            action={
              user ? (
                <Link to="/playtests/new" className={buttonClass({ variant: 'primary' })}>
                  {t('playtests.publish')}
                </Link>
              ) : undefined
            }
          >
            {t('playtests.empty')}
          </StateMessage>
        )}
        {!query.loading && query.data?.items.map((p) => <PlaytestCard key={p.id} playtest={p} />)}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={(p) => {
            setPage(p);
            window.scrollTo(0, 0);
          }}
        />
      )}
    </>
  );
}
