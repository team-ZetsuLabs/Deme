import { useTranslation } from 'react-i18next';
import type { ProjectType } from '../../api/types';
import styles from './ProjectTypeBadge.module.css';

export type ProjectTypeBadgeProps = { type: ProjectType };

/** Nature du projet : étude, startup ou open source. */
export function ProjectTypeBadge({ type }: ProjectTypeBadgeProps) {
  const { t } = useTranslation();
  return <span className={styles.badge}>{t(`projects.types.${type}`)}</span>;
}
