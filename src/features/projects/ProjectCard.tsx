import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProjectSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { RelativeTime } from '../../components/RelativeTime';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { ProjectTypeBadge } from './ProjectTypeBadge';
import styles from './ProjectCard.module.css';

export type ProjectCardProps = { project: ProjectSummary };

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  return (
    <article className={styles.row}>
      <Avatar
        name={project.owner.displayName}
        photoUrl={project.owner.avatarUrl ?? null}
        size={44}
        square
      />
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/projects/${project.id}`}>{project.title}</Link>
        </h2>
        <p className={styles.owner}>
          {project.owner.displayName}
          <span aria-hidden="true"> · </span>
          <RelativeTime iso={project.lastActivityAt} />
        </p>
        <div className={styles.meta}>
          <ProjectTypeBadge type={project.type} />
          <span className={styles.fact}>{t('projects.team', { count: project.teamSize })}</span>
          {project.status === 'OPEN' && project.openRoles.length > 0 && (
            <span className={styles.open}>
              {t('projects.openRoles', { count: project.openRoles.length })}
            </span>
          )}
        </div>
        {project.technologies.length > 0 && (
          <ul className={styles.tags}>
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.action}>
        <ProjectStatusBadge status={project.status} />
      </div>
    </article>
  );
}
