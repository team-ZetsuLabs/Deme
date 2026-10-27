import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/ErrorState';
import { Flag } from '../../components/Flag';
import { LeaderboardSkeleton } from '../../components/skeleton/LeaderboardSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useApiQuery } from '../../hooks/useApiQuery';
import { countryName } from '../../i18n/countries';
import { useSession } from '../auth/useSession';
import { challengesApi } from './challengesApi';
import styles from './Leaderboard.module.css';

export type CountryLeaderboardProps = {
  challengeId: number;
  refreshKey: number;
};

/** Classement par pays du défi en cours (CH-5) : « on code aussi pour le drapeau ». */
export function CountryLeaderboard({ challengeId, refreshKey }: CountryLeaderboardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const query = useApiQuery(
    () => challengesApi.countryLeaderboard(challengeId),
    [challengeId, refreshKey],
  );

  if (query.loading) return <LeaderboardSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />;
  if (!query.data?.length) return <StateMessage>{t('challenges.board.empty')}</StateMessage>;

  return (
    <table className={styles.table}>
      <caption className="sr-only">{t('challenges.board.countryCaption')}</caption>
      <thead>
        <tr>
          <th scope="col">{t('challenges.board.rank')}</th>
          <th scope="col">{t('challenges.board.country')}</th>
          <th scope="col" className={styles.num}>
            {t('challenges.board.points')}
          </th>
        </tr>
      </thead>
      <tbody>
        {query.data.map((entry) => {
          const mine = !!user?.countryCode && user.countryCode === entry.country;
          const name = countryName(entry.country, i18n.language) ?? entry.country;
          return (
            <tr key={entry.country} className={mine ? styles.me : undefined}>
              <td className={entry.rank === 1 ? `${styles.rank} ${styles.first}` : styles.rank}>
                #{entry.rank}
              </td>
              <td>
                <span className={styles.person}>
                  <Flag code={entry.country} width={27} />
                  <span>
                    <b className={styles.countryName}>{name}</b>
                    {mine && ` ${t('challenges.board.yourCountry')}`}
                    <small>
                      {t('challenges.board.participants', { count: entry.participants })}
                    </small>
                  </span>
                </span>
              </td>
              <td className={styles.num}>{entry.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
