import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { ProjectCardsSkeleton } from '../../components/skeleton/ProjectCardsSkeleton';
import { ProjectCard } from '../../features/projects/ProjectCard';
import { projectsApi } from '../../features/projects/projectsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../projects/ProjectsPage.module.css';

/** Projets portés par le membre connecté (PRJ). */
export default function MyProjectsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => projectsApi.mine(page), [page]);
  usePageTitle(t('projects.myProjects.pageTitle'));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('projects.myProjects.pageTitle')}</h1>
          <p className={styles.lead}>{t('projects.myProjects.lead')}</p>
        </div>
        <div className={styles.headActions}>
          <Link to="/projects/new" className={buttonClass({ variant: 'secondary' })}>
            {t('projects.propose')}
          </Link>
        </div>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <ProjectCardsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage
            action={
              <Link to="/projects/new" className={buttonClass({ variant: 'secondary' })}>
                {t('projects.propose')}
              </Link>
            }
          >
            {t('projects.myProjects.empty')}
          </StateMessage>
        )}
        {!query.loading &&
          query.data?.items.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={setPage}
        />
      )}
    </>
  );
}
