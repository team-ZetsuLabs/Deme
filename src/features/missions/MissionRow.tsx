import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MissionSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { RelativeTime } from '../../components/RelativeTime';
import { MissionFacts } from './MissionFacts';
import styles from './MissionRow.module.css';

export type MissionRowProps = { mission: MissionSummary };

export function MissionRow({ mission: m }: MissionRowProps) {
  const { t } = useTranslation();
  return (
    <article className={styles.row}>
      <div className={styles.body}>
        <MissionFacts mission={m} />
        <h3 className={styles.title}>
          <Link to={`/missions/${m.id}`}>{m.title}</Link>
        </h3>
        <div className={styles.foot}>
          <ul className={styles.tags}>
            {m.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <div className={styles.who}>
            <Avatar name={m.author.displayName} photoUrl={m.author.avatarUrl ?? null} size={24} />
            <span className={styles.author}>{m.author.displayName}</span>
            <RelativeTime iso={m.createdAt} />
          </div>
        </div>
      </div>
      <div className={styles.side}>
        <span className={styles.offers}>
          {t('missions.offerCount', { count: m.applicationCount })}
        </span>
      </div>
    </article>
  );
}
