import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Answer } from '../../api/types';
import { Button } from '../../components/Button';
import { CodeBlock } from '../../components/CodeBlock';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { useToast } from '../../components/useToast';
import { HiddenNotice } from '../moderation/HiddenNotice';
import { AnswerForm } from './AnswerForm';
import { AuthorCard } from './AuthorCard';
import { CommentThread } from './CommentThread';
import { questionsApi } from './questionsApi';
import { VoteControl } from './VoteControl';
import styles from './QuestionDetail.module.css';

export type AnswerItemProps = {
  answer: Answer;
  /** Le membre connecté est l'auteur de la question : il peut accepter (QA-5). */
  canAccept: boolean;
  accepting: boolean;
  onAccept: () => void;
  onVote: (score: number, myVote: number | null) => void;
  onEdited: (answer: Answer) => void;
  /** Actions en plus, à droite des boutons (signalement). */
  extraActions?: ReactNode;
};

export function AnswerItem({
  answer: a,
  canAccept,
  accepting,
  onAccept,
  onVote,
  onEdited,
  extraActions,
}: AnswerItemProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const classes = [styles.post, styles.answer, a.accepted && styles.accepted]
    .filter(Boolean)
    .join(' ');

  const saveEdit = async (body: { body: string; code: string | null }) => {
    const updated = await questionsApi.updateAnswer(a.id, body);
    onEdited(updated);
    setEditing(false);
    toast(t('question.edited'));
    requestAnimationFrame(() => document.getElementById(`answer-${a.id}`)?.focus());
  };

  return (
    <article className={classes} id={`answer-${a.id}`} tabIndex={-1}>
      <div className={styles.side}>
        <VoteControl
          target="answer"
          id={a.id}
          authorUsername={a.author.username}
          score={a.score}
          myVote={a.myVote}
          onChange={onVote}
        />
        {a.accepted && (
          <span className={styles.acceptedMark}>
            <Icon name="check" size={16} />
          </span>
        )}
      </div>
      <div className={styles.content}>
        {(a.accepted || a.sameContext) && (
          <div className={styles.badges}>
            {a.accepted && (
              <span className={styles.acceptedLabel}>
                <Icon name="check" size={14} />
                {t('question.accepted')}
              </span>
            )}
            {a.sameContext && (
              <span className={styles.sameContext}>
                <Icon name="pin" size={13} />
                {t('question.sameCountry')}
              </span>
            )}
          </div>
        )}

        {a.hidden && a.canEdit && (
          <HiddenNotice
            targetType="ANSWER"
            targetId={a.id}
            hidden={a.hidden}
            onAppealed={(hidden) => onEdited({ ...a, hidden })}
          />
        )}

        {editing ? (
          <AnswerForm
            idPrefix={`edit-${a.id}`}
            initialBody={a.bodyMarkdown}
            initialCode={a.code}
            submitLabel={t('question.saveEdit')}
            onSubmit={saveEdit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <MemberContent html={a.bodyHtml} />
            {a.code && <CodeBlock code={a.code} />}
          </>
        )}

        <div className={styles.foot}>
          <div className={styles.actions}>
            {canAccept && !a.accepted && (
              <Button size="sm" busy={accepting} onClick={onAccept}>
                <Icon name="check" size={14} />
                {t('question.accept')}
              </Button>
            )}
            {a.canEdit && !editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                {t('question.edit')}
              </Button>
            )}
            {extraActions}
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
        <CommentThread
          target="answer"
          targetId={a.id}
          comments={a.comments ?? []}
          onAdded={(comment) => onEdited({ ...a, comments: [...(a.comments ?? []), comment] })}
        />
      </div>
    </article>
  );
}
