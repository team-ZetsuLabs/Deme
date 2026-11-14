import { useTranslation } from 'react-i18next';
import type { CommunityProposal } from '../../api/types';
import { Icon } from '../../components/Icon';
import styles from './ProposalStatusBadge.module.css';

export type ProposalStatusBadgeProps = { status: CommunityProposal['status'] };

/** En attente, acceptée, refusée (COM-2). */
export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {status === 'APPROVED' && <Icon name="check" size={13} />}
      {t(`communities.propose.status.${status}`)}
    </span>
  );
}
