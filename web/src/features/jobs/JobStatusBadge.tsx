import { useTranslation } from 'react-i18next';
import type { JobStatus } from '../../api/types';
import styles from './JobStatusBadge.module.css';

export type JobStatusBadgeProps = { status: JobStatus };

/** Statut de validation d'une offre par l'équipe (JOB-4) : en attente, publiée, refusée, clôturée. */
export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`${styles.badge} ${styles[status]}`}>{t(`jobs.jobStatus.${status}`)}</span>
  );
}
