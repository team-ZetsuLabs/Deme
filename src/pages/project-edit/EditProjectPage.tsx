import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { StateMessage } from '../../components/StateMessage';
import { ProjectDetailSkeleton } from '../../components/skeleton/ProjectDetailSkeleton';
import { useToast } from '../../components/useToast';
import { ProjectForm } from '../../features/projects/ProjectForm';
import { projectsApi } from '../../features/projects/projectsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../project-new/NewProjectPage.module.css';

export default function EditProjectPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <EditProject id={id} /> : <NotFoundPage />;
}

/** Modifier son projet (PRJ). Réservé à son porteur. */
function EditProject({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useApiQuery(() => projectsApi.get(id), [id]);
  usePageTitle(t('projects.edit.pageTitle'));

  if (query.loading) return <ProjectDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  const project = query.data;
  if (query.error || !project) return <ErrorState error={query.error} onRetry={query.reload} />;

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('projects.edit.pageTitle')}</h1>
      {project.canEdit && project.status === 'OPEN' ? (
        <>
          <p className={styles.lead}>{t('projects.edit.lead')}</p>
          <ProjectForm
            initial={project}
            onSaved={(saved) => {
              toast(t('projects.edit.saved'));
              navigate(`/projects/${saved.id}`, { replace: true });
            }}
          />
        </>
      ) : (
        <StateMessage
          action={
            <Link to={`/projects/${project.id}`} className={buttonClass({ variant: 'secondary' })}>
              {t('projects.edit.back')}
            </Link>
          }
        >
          {t(
            project.status === 'COMPLETED' ? 'projects.edit.completed' : 'projects.edit.notAllowed',
          )}
        </StateMessage>
      )}
    </section>
  );
}
