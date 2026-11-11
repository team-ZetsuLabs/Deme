import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { buttonClass } from '../../components/buttonClass';
import { StateMessage } from '../../components/StateMessage';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { FeedItem } from '../../features/feed/FeedItem';
import { mergeFeed } from '../../features/feed/feedEntries';
import { jobsApi } from '../../features/jobs/jobsApi';
import { missionsApi } from '../../features/missions/missionsApi';
import { projectsApi } from '../../features/projects/projectsApi';
import { questionsApi } from '../../features/questions/questionsApi';
import { playtestsApi } from '../../features/playtests/playtestsApi';
import { challengesApi } from '../../features/challenges/challengesApi';
import { useSession } from '../../features/auth/useSession';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './FeedPage.module.css';

/**
 * Accueil du membre connecté : un fil unique qui mélange tous les espaces (questions, offres,
 * missions, projets, tests fermés), du plus récent au plus ancien, avec un rail profil + défi.
 */
export default function FeedPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  usePageTitle(t('feed.pageTitle'));

  const questions = useApiQuery(
    () =>
      questionsApi.list({
        status: 'all',
        sort: 'recent',
        tag: null,
        country: null,
        operator: null,
        q: null,
        page: 0,
      }),
    [],
  );
  const jobs = useApiQuery(
    () => jobsApi.list({ type: 'all', country: null, tech: null, page: 0 }),
    [],
  );
  const missions = useApiQuery(
    () => missionsApi.list({ kind: 'all', country: null, tech: null, page: 0 }),
    [],
  );
  const projects = useApiQuery(() => projectsApi.list({ type: 'all', tech: null, page: 0 }), []);
  const playtests = useApiQuery(
    () => playtestsApi.list({ status: 'ACTIVE', availability: 'all', page: 0 }),
    [],
  );
  const challenge = useApiQuery(() => challengesApi.current(), []);

  const sources = [questions, jobs, missions, projects, playtests];
  const loading = sources.some((q) => q.loading);
  const entries = mergeFeed({
    questions: questions.data?.items,
    jobs: jobs.data?.items,
    missions: missions.data?.items,
    projects: projects.data?.items,
    playtests: playtests.data?.items,
  });

  return (
    <div className={styles.layout}>
      <main className={styles.stream}>
        <div className={styles.head}>
          <h1 className={styles.title}>
            {user ? t('feed.greeting', { name: user.displayName }) : t('feed.title')}
          </h1>
          <p className={styles.lead}>{t('feed.lead')}</p>
        </div>

        <div aria-busy={loading}>
          {loading && <ListRowsSkeleton count={5} />}
          {!loading && entries.length === 0 && (
            <StateMessage
              action={
                <Link to="/questions/ask" className={buttonClass({ variant: 'primary' })}>
                  {t('home.cta.email')}
                </Link>
              }
            >
              {t('feed.empty')}
            </StateMessage>
          )}
          {!loading &&
            entries.map((entry) => <FeedItem key={`${entry.kind}-${entry.key}`} entry={entry} />)}
        </div>
      </main>

      <aside className={styles.rail}>
        {user && (
          <section className={styles.profile}>
            <Avatar name={user.displayName} photoUrl={user.avatarUrl ?? null} size={56} />
            <div className={styles.profileText}>
              <Link to="/users/me" className={styles.profileName}>
                {user.displayName}
              </Link>
              <span className={styles.profileMeta}>
                {t('feed.profile.stats', {
                  points: user.reputation,
                  level: t(`levels.${user.level}`),
                })}
              </span>
            </div>
            <Link
              to="/users/me"
              className={buttonClass({ variant: 'secondary', size: 'sm', block: true })}
            >
              {t('feed.profile.view')}
            </Link>
          </section>
        )}

        {!challenge.loading && challenge.data && (
          <section className={styles.railCard} aria-label={t('feed.sections.challenge')}>
            <span className={styles.railKicker}>
              <Icon name="trophy" size={15} /> {t('feed.sections.challenge')}
            </span>
            <h2 className={styles.railTitle}>{challenge.data.title}</h2>
            <button
              type="button"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
              onClick={() => navigate('/challenges')}
            >
              {t('feed.sections.challengeGo')}
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
