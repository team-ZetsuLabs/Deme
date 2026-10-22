import { useTranslation } from 'react-i18next';
import type { Answer } from '../../api/provisional-types';
import { Button } from '../../components/Button';
import { CodeBlock } from '../../components/CodeBlock';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { AuthorCard } from './AuthorCard';
import { VoteControl } from './VoteControl';
import styles from './QuestionDetail.module.css';

export type AnswerItemProps = {
  answer: Answer;
  /** Le membre connecté est l'auteur de la question : il peut accepter (QA-5). */
  canAccept: boolean;
  /** L'auteur de la réponse vient du même pays que la question (QA-10). */
  sameCountry: boolean;
  accepting: boolean;
  onAccept: () => void;
  onVote: (votes: number, voted: boolean) => void;
};

export function AnswerItem({
  answer: a,
  canAccept,
  sameCountry,
  accepting,
  onAccept,
  onVote,
}: AnswerItemProps) {
  const { t } = useTranslation();
  const classes = [styles.post, styles.answer, a.accepted && styles.accepted]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes} id={`answer-${a.id}`}>
      <div className={styles.side}>
        <VoteControl
          target="answer"
          id={a.id}
          authorId={a.author.id}
          votes={a.votes}
          voted={a.voted}
          onChange={onVote}
        />
        {a.accepted && (
          <span className={styles.acceptedMark}>
            <Icon name="check" size={16} />
          </span>
        )}
      </div>
      <div className={styles.content}>
        {(a.accepted || sameCountry) && (
          <div className={styles.badges}>
            {a.accepted && (
              <span className={styles.acceptedLabel}>
                <Icon name="check" size={14} />
                {t('question.accepted')}
              </span>
            )}
            {sameCountry && (
              <span className={styles.sameContext}>
                <Icon name="pin" size={13} />
                {t('question.sameCountry')}
              </span>
            )}
          </div>
        )}
        <MemberContent html={a.bodyHtml} />
        {a.code && <CodeBlock code={a.code} />}
        <div className={styles.foot}>
          <div>
            {canAccept && !a.accepted && (
              <Button size="sm" busy={accepting} onClick={onAccept}>
                <Icon name="check" size={14} />
                {t('question.accept')}
              </Button>
            )}
          </div>
          <AuthorCard
            author={a.author}
            label={
              <>
                {t('question.answered')} <RelativeTime iso={a.createdAt} />
              </>
            }
          />
        </div>
      </div>
    </article>
  );
}
