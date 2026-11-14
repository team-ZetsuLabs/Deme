import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { StateMessage } from '../../components/StateMessage';
import { JobDetailSkeleton } from '../../components/skeleton/JobDetailSkeleton';
import { useToast } from '../../components/useToast';
import { PlaytestForm } from '../../features/playtests/PlaytestForm';
import { playtestsApi } from '../../features/playtests/playtestsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../ask/AskPage.module.css';

export default function EditPlaytestPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <EditPlaytest id={id} /> : <NotFoundPage />;
}

/** Modifier sa campagne en brouillon ou refusée (TST-1). Réservée à son porteur. */
function EditPlaytest({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useApiQuery(() => playtestsApi.get(id), [id]);
  usePageTitle(t('playtests.edit.pageTitle'));

  if (query.loading) return <JobDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  const playtest = query.data;
  if (query.error || !playtest) return <ErrorState error={query.error} onRetry={query.reload} />;

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('playtests.edit.pageTitle')}</h1>
      {playtest.canEdit ? (
        <>
          <p className={styles.lead}>{t('playtests.edit.lead')}</p>
          <PlaytestForm
            initial={playtest}
            onSaved={(saved) => {
              toast(t('playtests.edit.saved'));
              navigate(`/playtests/${saved.id}`, { replace: true });
            }}
          />
        </>
      ) : (
        <StateMessage
          action={
            <Link
              to={`/playtests/${playtest.id}`}
              className={buttonClass({ variant: 'secondary' })}
            >
              {t('playtests.edit.back')}
            </Link>
          }
        >
          {t('playtests.edit.notAllowed')}
        </StateMessage>
      )}
    </section>
  );
}
