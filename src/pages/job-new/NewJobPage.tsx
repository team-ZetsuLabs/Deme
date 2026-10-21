import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { JobForm } from '../../features/jobs/JobForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NewJobPage.module.css';

/** Publier une offre (JOB-4). Réservée aux membres connectés (voir la route). */
export default function NewJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('jobs.new.pageTitle'));

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('jobs.new.pageTitle')}</h1>
      <p className={styles.lead}>{t('jobs.new.lead')}</p>
      <JobForm
        onCreated={(job) => {
          toast(t('jobs.new.created'));
          navigate(`/jobs/${job.id}`, { replace: true });
        }}
      />
    </section>
  );
}
