import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { StatsSkeleton } from '../../components/skeleton/StatsSkeleton';
import { useSession } from '../../features/auth/useSession';
import { OAuthButtons } from '../../features/auth/OAuthButtons';
import { HomeHeader } from '../../features/home/HomeHeader';
import { LevelLadder } from '../../features/home/LevelLadder';
import { SolvedPreview } from '../../features/home/SolvedPreview';
import { DEFAULT_LEVELS, statsApi } from '../../features/home/statsApi';
import { StatsStrip } from '../../features/home/StatsStrip';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Footer } from '../../layout/Footer';
import styles from './HomePage.module.css';

const POINTS = ['QUESTION', 'VOTE', 'ACCEPTED'] as const;
const EXCHANGES = [
  { key: 'knowledge', to: '/questions' },
  { key: 'missions', to: '/missions' },
  { key: 'collaboration', to: '/projects' },
  { key: 'visibility', to: '/jobs' },
] as const;
const DIFFERENCES = ['context', 'light', 'community'] as const;

/** Page d'accueil publique : comprendre Dɛmɛ en 10 secondes (cahier, section 12). */
export default function HomePage() {
  const { t } = useTranslation();
  const { status } = useSession();
  const navigate = useNavigate();
  // Les chiffres sont un plus : si /stats échoue, la page reste complète sans eux.
  const stats = useApiQuery(() => statsApi.get(), []);
  usePageTitle(t('home.pageTitle'));

  if (status === 'authenticated') return <Navigate to="/feed" replace />;

  return (
    <div className={`${styles.page} page-enter`}>
      <HomeHeader />
      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.title}>{t('home.title')}</h1>
            <p className={styles.lead}>{t('home.lead')}</p>
            <div className={styles.cta}>
              <OAuthButtons mode="register" onSignedIn={() => navigate('/feed')} />
              <div className={styles.ctaLinks}>
                <Link to="/register" className={buttonClass({ variant: 'ghost' })}>
                  {t('home.cta.email')}
                </Link>
                <Link to="/questions" className={buttonClass({ variant: 'ghost' })}>
                  {t('home.cta.browse')}
                </Link>
              </div>
            </div>
          </div>
          <SolvedPreview />
        </section>

        {(stats.loading || stats.data) && (
          <div className={styles.section}>
            {stats.data ? <StatsStrip stats={stats.data} /> : <StatsSkeleton />}
          </div>
        )}

        <section className={styles.section} aria-labelledby="home-exchanges-title">
          <h2 id="home-exchanges-title" className={styles.sectionTitle}>
            {t('home.exchanges.title')}
          </h2>
          <dl className={styles.exchanges}>
            {EXCHANGES.map(({ key, to }) => (
              <div key={key}>
                <dt>
                  <Link to={to}>{t(`home.exchanges.${key}.name`)}</Link>
                </dt>
                <dd>{t(`home.exchanges.${key}.text`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="home-diff-title">
          <h2 id="home-diff-title" className={styles.sectionTitle}>
            {t('home.differences.title')}
          </h2>
          <ol className={styles.differences}>
            {DIFFERENCES.map((key, i) => (
              <li key={key}>
                <span className={styles.number} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{t(`home.differences.${key}.title`)}</h3>
                  <p>{t(`home.differences.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="home-levels-title">
          <h2 id="home-levels-title" className={styles.sectionTitle}>
            {t('home.levels.title')}
          </h2>
          <p className={styles.sectionLead}>{t('home.levels.lead')}</p>
          <ul className={styles.points}>
            {POINTS.map((key) => (
              <li key={key}>
                <span className={styles.gain}>{t(`home.levels.points.${key}.value`)}</span>
                {t(`home.levels.points.${key}.label`)}
              </li>
            ))}
          </ul>
          <LevelLadder levels={stats.data?.levels ?? DEFAULT_LEVELS} />
        </section>

        <section className={`${styles.section} ${styles.final}`}>
          <h2 className={styles.sectionTitle}>{t('home.final.title')}</h2>
          <Link to="/register" className={buttonClass({ variant: 'primary' })}>
            {t('topbar.register')}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
