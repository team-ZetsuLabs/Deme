import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { StateMessage } from '../../components/StateMessage';
import { ProjectCard } from '../../features/projects/ProjectCard';
import {
  PROJECT_TYPES,
  projectsApi,
  type ProjectTypeFilter,
} from '../../features/projects/projectsApi';
import { useProjectFilters } from '../../features/projects/useProjectFilters';
import { useSession } from '../../features/auth/useSession';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ProjectCardsSkeleton } from '../../components/skeleton/ProjectCardsSkeleton';
import styles from './ProjectsPage.module.css';

const TYPES: ProjectTypeFilter[] = ['all', ...PROJECT_TYPES];

/** Espace Projets (PRJ) : projets ouverts au recrutement, filtrables par type et techno. */
export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { filters, update } = useProjectFilters();
  const [tech, setTech] = useState(filters.tech ?? '');
  const query = useApiQuery(() => projectsApi.list(filters), [filters]);
  usePageTitle(t('projects.pageTitle'));

  const onTech = (e: FormEvent) => {
    e.preventDefault();
    update({ tech: tech.trim().toLowerCase() || null });
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('projects.title')}</h1>
          <p className={styles.lead}>{t('projects.lead')}</p>
        </div>
        <div className={styles.headActions}>
          {user && (
            <Link to="/projects/mine" className={buttonClass({ variant: 'ghost' })}>
              {t('projects.mine')}
            </Link>
          )}
          <Link to="/projects/new" className={buttonClass({ variant: 'secondary' })}>
            {t('projects.propose')}
          </Link>
        </div>
      </div>

      <div className={styles.filters}>
        <Segmented<ProjectTypeFilter>
          label={t('projects.filters.type')}
          value={filters.type}
          onChange={(type) => update({ type })}
          options={TYPES.map((type) => ({
            value: type,
            label: t(`projects.filters.types.${type}`),
          }))}
        />
        <form className={styles.techForm} onSubmit={onTech} role="search">
          <label className="sr-only" htmlFor="projects-tech">
            {t('projects.filters.tech')}
          </label>
          <input
            id="projects-tech"
            className={styles.input}
            value={tech}
            placeholder={t('projects.filters.techPlaceholder')}
            autoCapitalize="none"
            onChange={(e) => setTech(e.target.value)}
          />
          <Button type="submit" size="sm">
            {t('projects.filters.apply')}
          </Button>
        </form>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <ProjectCardsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('projects.empty')}</StateMessage>
        )}
        {!query.loading &&
          query.data?.items.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={(page) => {
            update({ page });
            window.scrollTo(0, 0);
          }}
        />
      )}
    </>
  );
}
