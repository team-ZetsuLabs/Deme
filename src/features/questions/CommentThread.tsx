import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Comment } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { useToast } from '../../components/useToast';
import { useSession } from '../auth/useSession';
import { questionsApi, type VoteTarget } from './questionsApi';
import { COMMENT_MAX, COMMENT_MIN } from './validation';
import styles from './CommentThread.module.css';

/** Commentaires montrés d'emblée ; les autres se déplient. */
export const COMMENTS_VISIBLE = 3;

export type CommentThreadProps = {
  target: VoteTarget;
  targetId: number;
  comments: Comment[];
  onAdded: (comment: Comment) => void;
  onDeleted: (commentId: number) => void;
};

/** Commentaires courts sous une question ou une réponse (QA-9). */
export function CommentThread({
  target,
  targetId,
  comments,
  onAdded,
  onDeleted,
}: CommentThreadProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldId = `comment-${target}-${targetId}`;
  const errorId = `${fieldId}-error`;
  const hidden = expanded ? 0 : Math.max(comments.length - COMMENTS_VISIBLE, 0);
  const visible = hidden ? comments.slice(0, COMMENTS_VISIBLE) : comments;

  const onOpen = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  };

  const close = () => {
    setOpen(false);
    setBody('');
    setError(null);
  };

  const onDelete = async (id: number) => {
    try {
      await questionsApi.deleteComment(id);
      onDeleted(id);
    } catch (err) {
      toast(errorMessage(t, err));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (text.length < COMMENT_MIN) {
      setError(t('comments.tooShort', { min: COMMENT_MIN }));
      document.getElementById(fieldId)?.focus();
      return;
    }
    setBusy(true);
    try {
      const comment = await questionsApi.comment(target, targetId, text);
      onAdded(comment);
      setExpanded(true);
      close();
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.thread}>
      {visible.length > 0 && (
        <ul className={styles.list} aria-label={t('comments.label')}>
          {visible.map((c) => (
            <li key={c.id} className={styles.comment}>
              <MemberContent html={c.bodyHtml} className={styles.body} />
              <span className={styles.meta}>
                <Link to={`/users/${c.author.username}`}>{c.author.displayName}</Link>
                <span aria-hidden="true"> · </span>
                <RelativeTime iso={c.createdAt} />
                {c.canDelete && (
                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={t('comments.delete')}
                    onClick={() => onDelete(c.id)}
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          {t('comments.more', { count: hidden })}
        </button>
      )}

      {open ? (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label htmlFor={fieldId} className="sr-only">
            {t('comments.field')}
          </label>
          <textarea
            id={fieldId}
            rows={2}
            maxLength={COMMENT_MAX}
            placeholder={t('comments.placeholder')}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <div className={styles.formFoot}>
            <span className={styles.count} aria-hidden="true">
              {body.length}/{COMMENT_MAX}
            </span>
            <div className={styles.actions}>
              <Button size="sm" variant="ghost" onClick={close} disabled={busy}>
                {t('question.cancel')}
              </Button>
              <Button size="sm" type="submit" variant="primary" busy={busy}>
                {busy ? t('comments.busy') : t('comments.submit')}
              </Button>
            </div>
          </div>
          {error && (
            <p id={errorId} className={styles.error} role="alert">
              {error}
            </p>
          )}
        </form>
      ) : (
        <button type="button" className={styles.add} onClick={onOpen}>
          {t('comments.add')}
        </button>
      )}
    </div>
  );
}
