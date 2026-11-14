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
  /** Pseudo de l'auteur du contenu : on ne vote pas pour soi. */
  authorUsername: string;
  score: number;
  /** Vote du membre connecté : 1, -1 (posé ailleurs) ou absent. */
  myVote: number | null | undefined;
  onChange: (score: number, myVote: number | null) => void;
};

/**
 * Vote unique et annulable (QA-4), réservé au niveau Membre et plus, jamais sur ses propres contenus.
 * Ces contrôles évitent un appel inutile ; le serveur reste celui qui décide.
 */
export function VoteControl({
  target,
  id,
  authorUsername,
  score,
  myVote,
  onChange,
}: VoteControlProps) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const voted = myVote === 1;
  // Grisé plutôt que refusé après coup : on ne vote pas pour son propre contenu.
  const own = !!user && user.username === authorUsername;

  const onClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (own) return;
    if (user.level === 'NEWCOMER') return toast(t('question.voteLevel'));

    // Mise à jour immédiate, annulée si le serveur refuse.
    const previous = { score, myVote: myVote ?? null };
    onChange(voted ? score - 1 : score + (myVote === -1 ? 2 : 1), voted ? null : 1);
    setPending(true);
    try {
      const result = voted
        ? await questionsApi.unvote(target, id)
        : await questionsApi.vote(target, id);
      if (result) onChange(result.score, result.myVote ?? null);
    } catch (error) {
      onChange(previous.score, previous.myVote);
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
          own
            ? t('question.voteOwn')
            : voted
              ? t('question.unvote', { count: score })
              : t('question.vote', { count: score })
        }
        title={own ? t('question.voteOwn') : undefined}
        disabled={pending || own}
        onClick={onClick}
      >
        <Icon name="up" size={12} />
      </button>
      <strong aria-hidden="true">{score}</strong>
    </div>
  );
}
