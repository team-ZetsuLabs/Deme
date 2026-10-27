import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/Avatar';
import { Flag } from '../../components/Flag';
import { ErrorState } from '../../components/ErrorState';
import { LeaderboardSkeleton } from '../../components/skeleton/LeaderboardSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useApiQuery } from '../../hooks/useApiQuery';
import { countryName } from '../../i18n/countries';
import { useSession } from '../auth/useSession';
import { challengesApi } from './challengesApi';
import styles from './Leaderboard.module.css';

export type LeaderboardProps = {
  challengeId: number;
  /** Change quand le membre dépose son lien, pour recharger le classement. */
  refreshKey: number;
};

/** Classement du défi en cours (CH-1), avec la note sur 100 donnée par l'équipe (CH-3). */
export function Leaderboard({ challengeId, refreshKey }: LeaderboardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const query = useApiQuery(
    () => challengesApi.leaderboard(challengeId),
    [challengeId, refreshKey],
  );

  if (query.loading) return <LeaderboardSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />;
  if (!query.data?.length) return <StateMessage>{t('challenges.board.empty')}</StateMessage>;

  return (
    <table className={styles.table}>
      <caption className="sr-only">{t('challenges.board.caption')}</caption>
      <thead>
        <tr>
          <th scope="col">{t('challenges.board.rank')}</th>
          <th scope="col">{t('challenges.board.member')}</th>
          <th scope="col" className={styles.num}>
            {t('challenges.board.score')}
          </th>
        </tr>
      </thead>
      <tbody>
        {query.data.map((entry) => {
          const mine = user?.username === entry.member.username;
          const place = countryName(entry.member.countryCode ?? null, i18n.language);
          return (
            <tr key={entry.member.username} className={mine ? styles.me : undefined}>
              <td className={entry.rank === 1 ? `${styles.rank} ${styles.first}` : styles.rank}>
                {entry.score === null ? '–' : `#${entry.rank}`}
              </td>
              <td>
                <span className={styles.person}>
                  <Avatar
                    name={entry.member.displayName}
                    photoUrl={entry.member.avatarUrl ?? null}
                    size={32}
                  />
                  <span>
                    <Link to={`/users/${entry.member.username}`}>{entry.member.displayName}</Link>
                    {mine && ` ${t('challenges.board.you')}`}
                    {place && (
                      <small className={styles.place}>
                        <Flag code={entry.member.countryCode} width={15} />
                        {place}
                      </small>
                    )}
                  </span>
                </span>
              </td>
              <td className={styles.num}>
                {entry.score === null ? (
                  <span className={styles.pending}>{t('challenges.board.pending')}</span>
                ) : (
                  t('challenges.board.scoreValue', { score: entry.score })
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
