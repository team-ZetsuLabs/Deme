import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { MissionForm } from '../../features/missions/MissionForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../job-new/NewJobPage.module.css';

/** Publier une mission entre pairs (JOB-5). Réservée aux membres connectés (voir la route). */
export default function NewMissionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('missions.new.pageTitle'));

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('missions.new.pageTitle')}</h1>
      <p className={styles.lead}>{t('missions.new.lead')}</p>
      <MissionForm
        onSaved={(mission) => {
          toast(t('missions.new.created'));
          navigate(`/missions/${mission.id}`, { replace: true });
        }}
      />
    </section>
  );
}
