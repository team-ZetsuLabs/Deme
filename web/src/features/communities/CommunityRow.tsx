import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CommunitySummary, MembershipResult } from '../../api/types';
import { CommunityMark } from './CommunityMark';
import { JoinButton } from './JoinButton';
import styles from './CommunityRow.module.css';

export type CommunityRowProps = {
  community: CommunitySummary;
  onMembership: (result: MembershipResult) => void;
};

/** Une communauté dans la liste : repère, nom, description, chiffres, bouton Rejoindre. */
export function CommunityRow({ community: c, onMembership }: CommunityRowProps) {
  const { t, i18n } = useTranslation();
  const fmt = (n: number) => n.toLocaleString(i18n.language);
  return (
    <article className={styles.row}>
      <CommunityMark community={c} />
      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/communities/${c.slug}`}>{c.name}</Link>
        </h2>
        <p className={styles.kind}>
          {t(`communities.kinds.${c.kind}`)}
          {c.tag && <span className={styles.tag}>{c.tag}</span>}
        </p>
        <p className={styles.desc}>{c.description}</p>
        <p className={styles.stats}>
          {t('communities.members', { count: c.memberCount, formatted: fmt(c.memberCount) })}
          <span aria-hidden="true"> · </span>
          {t('communities.questions', {
            count: c.questionCount,
            formatted: fmt(c.questionCount),
          })}
        </p>
      </div>
      <JoinButton
        slug={c.slug}
        name={c.name}
        joined={c.joined}
        memberCount={c.memberCount}
        onChange={onMembership}
      />
    </article>
  );
}
