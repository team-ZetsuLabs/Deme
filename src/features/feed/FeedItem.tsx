import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../../components/Icon';
import { JobRow } from '../jobs/JobRow';
import { MissionRow } from '../missions/MissionRow';
import { ProjectCard } from '../projects/ProjectCard';
import { QuestionRow } from '../questions/QuestionRow';
import { PlaytestCard } from '../playtests/PlaytestCard';
import type { FeedEntry } from './feedEntries';
import styles from './FeedItem.module.css';

const ICONS: Record<FeedEntry['kind'], IconName> = {
  question: 'help',
  job: 'jobs',
  mission: 'mission',
  project: 'projects',
  playtest: 'install',
};

export type FeedItemProps = { entry: FeedEntry };

/** Une carte du flux unifié : un bandeau « type » puis le contenu de l'espace d'origine. */
export function FeedItem({ entry }: FeedItemProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <article className={styles.card}>
      <p className={styles.kicker}>
        <Icon name={ICONS[entry.kind]} size={14} />
        {t(`feed.kind.${entry.kind}`)}
      </p>
      <div className={styles.body}>
        {entry.kind === 'question' && (
          <QuestionRow
            question={entry.item}
            activeTag={null}
            onTag={(tag) => navigate(`/questions?tag=${encodeURIComponent(tag)}`)}
          />
        )}
        {entry.kind === 'job' && <JobRow job={entry.item} />}
        {entry.kind === 'mission' && <MissionRow mission={entry.item} />}
        {entry.kind === 'project' && <ProjectCard project={entry.item} />}
        {entry.kind === 'playtest' && <PlaytestCard playtest={entry.item} />}
      </div>
    </article>
  );
}
