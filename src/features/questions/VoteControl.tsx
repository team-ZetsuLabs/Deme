import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/useToast';
import { errorMessage } from '../../api/errorMessage';
import { useSession } from '../auth/useSession';
import { questionsApi, type VoteTarget } from './questionsApi';
import styles from './VoteControl.module.css';

export type VoteControlProps = {
  target: VoteTarget;
  id: number;
  authorId: number;
  votes: number;
  voted: boolean;
  onChange: (votes: number, voted: boolean) => void;
};

/**
 * Vote unique et annulable (QA-4), réservé au niveau Membre et plus, jamais sur ses propres contenus.
 * Ces contrôles évitent un appel inutile ; le serveur reste celui qui décide.
 */
export function VoteControl({ target, id, authorId, votes, voted, onChange }: VoteControlProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (user.id === authorId) return toast(t('question.voteOwn'));
    if (user.level === 'NEW') return toast(t('question.voteLevel'));

    // Mise à jour immédiate, annulée si le serveur refuse.
    const previous = { votes, voted };
    onChange(votes + (voted ? -1 : 1), !voted);
    setPending(true);
    try {
      const result = voted
        ? await questionsApi.unvote(target, id)
        : await questionsApi.vote(target, id);
      if (result) onChange(result.votes, result.voted);
    } catch (error) {
      onChange(previous.votes, previous.voted);
      toast(errorMessage(t, error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.col}>
      <button
        type="button"
        className={styles.vote}
        aria-pressed={voted}
        aria-label={
          voted ? t('question.unvote', { count: votes }) : t('question.vote', { count: votes })
        }
        disabled={pending}
        onClick={onClick}
      >
        <Icon name="up" size={12} />
      </button>
      <strong aria-hidden="true">{votes}</strong>
    </div>
  );
}
