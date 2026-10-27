import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { StateMessage } from '../../components/StateMessage';
import { MissionDetailSkeleton } from '../../components/skeleton/MissionDetailSkeleton';
import { useToast } from '../../components/useToast';
import { MissionForm } from '../../features/missions/MissionForm';
import { missionsApi } from '../../features/missions/missionsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../job-new/NewJobPage.module.css';

export default function EditMissionPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <EditMission id={id} /> : <NotFoundPage />;
}

/** Modifier sa mission (JOB-5), tant qu'elle est ouverte. Réservée à son auteur. */
function EditMission({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useApiQuery(() => missionsApi.get(id), [id]);
  usePageTitle(t('missions.edit.pageTitle'));

  if (query.loading) return <MissionDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  const mission = query.data;
  if (query.error || !mission) return <ErrorState error={query.error} onRetry={query.reload} />;

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('missions.edit.pageTitle')}</h1>
      {mission.canEdit && mission.status === 'OPEN' ? (
        <>
          <p className={styles.lead}>{t('missions.edit.lead')}</p>
          <MissionForm
            initial={mission}
            onSaved={(saved) => {
              toast(t('missions.edit.saved'));
              navigate(`/missions/${saved.id}`, { replace: true });
            }}
          />
        </>
      ) : (
        <StateMessage
          action={
            <Link to={`/missions/${mission.id}`} className={buttonClass({ variant: 'secondary' })}>
              {t('missions.edit.back')}
            </Link>
          }
        >
          {t(mission.status === 'OPEN' ? 'missions.edit.notAllowed' : 'missions.edit.notOpen')}
        </StateMessage>
      )}
    </section>
  );
}
