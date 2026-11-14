import { useTranslation } from 'react-i18next';
import type { ApplicationStatus } from '../../api/types';
import { Icon } from '../../components/Icon';
import styles from './ApplicationStatusBadge.module.css';

export type ApplicationStatusBadgeProps = { status: ApplicationStatus };

/** Envoyée, vue, retenue, refusée (JOB-7). */
export function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {status === 'SHORTLISTED' && <Icon name="check" size={13} />}
      {t(`jobs.status.${status}`)}
    </span>
  );
}
