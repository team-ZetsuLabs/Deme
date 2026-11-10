import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { MissionRowsSkeleton } from '../../components/skeleton/MissionRowsSkeleton';
import { PlaytestCard } from '../../features/playtests/PlaytestCard';
import { playtestsApi } from '../../features/playtests/playtestsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import jobStyles from '../jobs/JobsPage.module.css';

/** Mes campagnes de test fermé, tous statuts (brouillons compris). */
export default function MyPlaytestsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => playtestsApi.mine(page), [page]);
  usePageTitle(t('playtests.mine'));

  return (
    <>
      <div className={jobStyles.head}>
        <div>
          <h1 className={jobStyles.title}>{t('playtests.mine')}</h1>
          <p className={jobStyles.lead}>{t('playtests.mineLead')}</p>
        </div>
        <Link to="/playtests/new" className={buttonClass({ variant: 'primary' })}>
          {t('playtests.publish')}
        </Link>
      </div>

      <div className={jobStyles.panel} aria-busy={query.loading}>
        {query.loading && <MissionRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage
            action={
              <Link to="/playtests/new" className={buttonClass({ variant: 'primary' })}>
                {t('playtests.publish')}
              </Link>
            }
          >
            {t('playtests.mineEmpty')}
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
