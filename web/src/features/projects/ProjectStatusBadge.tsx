import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '../../api/types';
import styles from './ProjectStatusBadge.module.css';

export type ProjectStatusBadgeProps = { status: ProjectStatus };

/** Statut d'un projet : ouvert au recrutement, ou clôturé. */
export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {t(`projects.projectStatus.${status}`)}
    </span>
  );
}
