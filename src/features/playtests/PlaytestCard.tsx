import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlaytestSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Flag } from '../../components/Flag';
import { PlaytestProgress } from './PlaytestProgress';
import styles from './PlaytestCard.module.css';

export type PlaytestCardProps = { playtest: PlaytestSummary };

/** Campagne de test fermé dans une liste (TST-1). */
export function PlaytestCard({ playtest: p }: PlaytestCardProps) {
  const { t } = useTranslation();
  const full = p.spotsLeft <= 0;
  return (
    <article className={styles.card}>
      <Avatar name={p.appName} photoUrl={p.iconUrl ?? null} size={48} square />
      <div className={styles.body}>
        <div className={styles.top}>
          <h2 className={styles.title}>
            <Link to={`/playtests/${p.id}`}>{p.appName}</Link>
          </h2>
          <span className={`${styles.status} ${styles[p.status.toLowerCase()] ?? ''}`}>
            {t(`playtests.status.${p.status}`)}
          </span>
        </div>
        <p className={styles.pkg}>{p.packageName}</p>
        <div className={styles.who}>
          <Avatar name={p.owner.displayName} photoUrl={p.owner.avatarUrl ?? null} size={20} />
          <span>{p.owner.displayName}</span>
          <Flag code={p.owner.countryCode} label={null} width={16} />
        </div>
        <PlaytestProgress
          progress={p.progress}
          label={
            full
              ? t('playtests.full')
              : t('playtests.spotsLeft', { count: p.spotsLeft, target: p.testersTarget })
          }
        />
      </div>
    </article>
  );
}
