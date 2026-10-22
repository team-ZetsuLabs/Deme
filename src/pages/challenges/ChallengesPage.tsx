import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { safeUrl } from '../../components/safeUrl';
import { ChallengeSkeleton } from '../../components/skeleton/ChallengeSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { challengesApi } from '../../features/challenges/challengesApi';
import { Countdown } from '../../features/challenges/Countdown';
import { remainingUntil } from '../../features/challenges/remaining';
import { CountryLeaderboard } from '../../features/challenges/CountryLeaderboard';
import { Leaderboard } from '../../features/challenges/Leaderboard';
import { Segmented } from '../../components/Segmented';
import { SubmitDialog } from '../../features/challenges/SubmitDialog';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './ChallengesPage.module.css';

/** Défi en cours (CH-1), dépôt d'un lien GitHub (CH-2) et classement. */
type BoardView = 'members' | 'countries';

export default function ChallengesPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const [boardView, setBoardView] = useState<BoardView>('members');
  const query = useApiQuery(() => challengesApi.current(), []);
  const c = query.data;
  usePageTitle(t('challenges.pageTitle'));

  if (query.loading) return <ChallengeSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <section className={styles.panel}>
        <StateMessage>{t('challenges.none')}</StateMessage>
      </section>
    );
  }
  if (query.error || !c) return <ErrorState error={query.error} onRetry={query.reload} />;

  const ended = remainingUntil(c.endsAt, Date.now()).ended;
  const repo = c.mySubmission ? safeUrl(c.mySubmission.repoUrl) : null;

  const onSubmitClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSubmitting(true);
  };

  return (
    <>
      <section className={`${styles.panel} ${styles.challenge}`} aria-labelledby="challenge-title">
        <div>
          <h1 id="challenge-title" className={styles.title}>
            {c.title}
          </h1>
          <p className={styles.meta}>
            {t('challenges.current')}
            <span className={styles.points}>{t('challenges.reward', { points: c.points })}</span>
          </p>
          <p className={styles.summary}>{c.summary}</p>
          <ul className={styles.specs}>
            {c.specs.map((spec) => (
              <li key={spec.text}>
                <span className={styles.label}>{spec.label ?? '·'}</span>
                {spec.text}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.side}>
          <Countdown endsAt={c.endsAt} />
          {c.mySubmission ? (
            <div className={styles.submitted}>
              <p>
                <Icon name="check" size={14} />
                {t(`challenges.submission.${c.mySubmission.status}`, {
                  score: c.mySubmission.score,
                })}
              </p>
              {repo && (
                <a href={repo} rel="noopener noreferrer nofollow" className={styles.repo}>
                  {repo.replace('https://github.com/', '')}
                </a>
              )}
            </div>
          ) : (
            <Button variant="primary" block onClick={onSubmitClick} disabled={ended}>
              {t('challenges.submit.button')}
            </Button>
          )}
          <p className={styles.count}>
            {t('challenges.submissions', { count: c.submissionCount })}
          </p>
        </div>
      </section>

      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>{t('challenges.board.title')}</h2>
        <Segmented<BoardView>
          label={t('challenges.board.view')}
          value={boardView}
          onChange={setBoardView}
          options={[
            { value: 'members', label: t('challenges.board.members') },
            { value: 'countries', label: t('challenges.board.countries') },
          ]}
        />
      </div>
      <section className={styles.panel} aria-label={t('challenges.board.title')}>
        {boardView === 'members' ? (
          <Leaderboard challengeId={c.id} refreshKey={boardKey} />
        ) : (
          <CountryLeaderboard challengeId={c.id} refreshKey={boardKey} />
        )}
      </section>

      {user && (
        <SubmitDialog
          open={submitting}
          challengeId={c.id}
          onClose={() => setSubmitting(false)}
          onSubmitted={(submission) => {
            query.setData((current) => ({
              ...current,
              mySubmission: submission,
              submissionCount: current.submissionCount + 1,
            }));
            setBoardKey((k) => k + 1);
            toast(t('challenges.submit.sent'));
          }}
        />
      )}
    </>
  );
}
