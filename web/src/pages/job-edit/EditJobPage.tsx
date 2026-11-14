import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { StateMessage } from '../../components/StateMessage';
import { JobDetailSkeleton } from '../../components/skeleton/JobDetailSkeleton';
import { useToast } from '../../components/useToast';
import { JobForm } from '../../features/jobs/JobForm';
import { jobsApi } from '../../features/jobs/jobsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../job-new/NewJobPage.module.css';

export default function EditJobPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <EditJob id={id} /> : <NotFoundPage />;
}

/** Modifier son offre (JOB-4) : elle repasse en validation. Réservée à son recruteur. */
function EditJob({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useApiQuery(() => jobsApi.get(id), [id]);
  usePageTitle(t('jobs.edit.pageTitle'));

  if (query.loading) return <JobDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  const job = query.data;
  if (query.error || !job) return <ErrorState error={query.error} onRetry={query.reload} />;

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('jobs.edit.pageTitle')}</h1>
      {job.canEdit && job.status !== 'CLOSED' ? (
        <>
          <p className={styles.lead}>{t('jobs.edit.lead')}</p>
          <JobForm
            initial={job}
            onSaved={(saved) => {
              toast(t('jobs.edit.saved'));
              navigate(`/jobs/${saved.id}`, { replace: true });
            }}
          />
        </>
      ) : (
        <StateMessage
          action={
            <Link to={`/jobs/${job.id}`} className={buttonClass({ variant: 'secondary' })}>
              {t('jobs.edit.back')}
            </Link>
          }
        >
          {t(job.status === 'CLOSED' ? 'jobs.edit.closed' : 'jobs.edit.notAllowed')}
        </StateMessage>
      )}
    </section>
  );
}
