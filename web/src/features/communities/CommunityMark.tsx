import type { CommunitySummary } from '../../api/types';
import { Flag } from '../../components/Flag';
import styles from './CommunityMark.module.css';

export type CommunityMarkProps = {
  community: Pick<CommunitySummary, 'kind' | 'countryCode' | 'tag' | 'name'>;
  size?: 'md' | 'lg';
};

/** Repère visuel d'une communauté : le drapeau du pays, ou un « # » pour une techno. Décoratif. */
export function CommunityMark({ community, size = 'md' }: CommunityMarkProps) {
  const flag = community.kind === 'COUNTRY' && community.countryCode;
  return (
    <span
      className={size === 'lg' ? `${styles.mark} ${styles.lg}` : styles.mark}
      aria-hidden="true"
    >
      {flag ? <Flag code={community.countryCode} width={size === 'lg' ? 39 : 27} /> : '#'}
    </span>
  );
}
