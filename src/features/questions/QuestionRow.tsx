import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { QuestionSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { RelativeTime } from '../../components/RelativeTime';
import { Tag } from '../../components/Tag';
import { ContextChips } from './ContextChips';
import styles from './QuestionRow.module.css';

export type QuestionRowProps = {
  question: QuestionSummary;
  activeTag: string | null;
  onTag: (tag: string) => void;
};

export function QuestionRow({ question: q, activeTag, onTag }: QuestionRowProps) {
  const { t } = useTranslation();
  const answersClass = q.hasAcceptedAnswer
    ? `${styles.answers} ${styles.solved}`
    : q.answerCount
      ? styles.answers
      : `${styles.answers} ${styles.none}`;

  return (
    <article className={styles.row}>
      <div className={styles.stat}>
        <strong>{q.score}</strong>
        <span>{t('questions.row.votes', { count: q.score })}</span>
      </div>
      <div className={`${styles.stat} ${styles.answersCol}`}>
        <div className={answersClass}>
          <strong>{q.answerCount}</strong>
          <span>
            {q.hasAcceptedAnswer
              ? t('questions.row.solved')
              : t('questions.row.answers', { count: q.answerCount })}
          </span>
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/questions/${q.id}`}>{q.title}</Link>
        </h3>
        <p className={styles.excerpt}>{q.excerpt}</p>
        <ContextChips context={q.context} />
        <div className={styles.foot}>
          <div className={styles.tags}>
            {q.tags.map((tag) => (
              <Tag key={tag} pressed={activeTag === tag} onClick={() => onTag(tag)}>
                {tag}
              </Tag>
            ))}
          </div>
          <div className={styles.who}>
            <Avatar name={q.author.displayName} photoUrl={q.author.avatarUrl ?? null} size={24} />
            <span className={styles.author}>{q.author.displayName}</span>
            <RelativeTime iso={q.createdAt} />
          </div>
        </div>
      </div>
    </article>
  );
}
