import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { JobForm } from '../../features/jobs/JobForm';
import { isRecruiter } from '../../features/jobs/recruiter';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NewJobPage.module.css';

/** Publier une offre (JOB-4). Réservée aux membres connectés (voir la route). */
export default function NewJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSession();
  usePageTitle(t('jobs.new.pageTitle'));

  // Le serveur refuse aussi (403 RECRUITER_ONLY) : on l'explique avant le formulaire.
  if (!isRecruiter(user)) {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>{t('jobs.new.pageTitle')}</h1>
        <StateMessage
          action={
            <Link to="/jobs" className={buttonClass({ variant: 'secondary' })}>
              {t('jobs.new.backToJobs')}
            </Link>
          }
        >
          {t('jobs.new.recruiterOnly')}
        </StateMessage>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('jobs.new.pageTitle')}</h1>
      <p className={styles.lead}>{t('jobs.new.lead')}</p>
      <JobForm
        onSaved={(job) => {
          toast(t('jobs.new.created'));
          navigate(`/jobs/${job.id}`, { replace: true });
        }}
      />
    </section>
  );
}
