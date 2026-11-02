import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { HomeSection } from '../../features/feed/HomeSection';
import { JobRow } from '../../features/jobs/JobRow';
import { jobsApi } from '../../features/jobs/jobsApi';
import { MissionRow } from '../../features/missions/MissionRow';
import { missionsApi } from '../../features/missions/missionsApi';
import { ProjectCard } from '../../features/projects/ProjectCard';
import { projectsApi } from '../../features/projects/projectsApi';
import { QuestionRow } from '../../features/questions/QuestionRow';
import { questionsApi } from '../../features/questions/questionsApi';
import { challengesApi } from '../../features/challenges/challengesApi';
import { useSession } from '../../features/auth/useSession';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './FeedPage.module.css';

/**
 * Accueil du membre connecté : un portail qui rassemble un aperçu de chaque espace
 * (questions, offres, missions, défi), chacun chargé indépendamment depuis son endpoint.
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
  const challenge = useApiQuery(() => challengesApi.current(), []);
  const current = challenge.data;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>
          {user ? t('feed.greeting', { name: user.displayName }) : t('feed.title')}
        </h1>
        <p className={styles.lead}>{t('feed.lead')}</p>
      </div>

      {!challenge.loading && current && (
        <section className={styles.challenge} aria-label={t('feed.sections.challenge')}>
          <div className={styles.challengeText}>
            <span className={styles.challengeKicker}>
              <Icon name="trophy" size={15} /> {t('feed.sections.challenge')}
            </span>
            <h2 className={styles.challengeTitle}>{current.title}</h2>
          </div>
          <Link to="/challenges" className={styles.challengeLink}>
            {t('feed.sections.challengeGo')}
          </Link>
        </section>
      )}

      <HomeSection
        title={t('feed.sections.questions')}
        to="/questions"
        toLabel={t('feed.sections.allQuestions')}
        query={questions}
        limit={4}
        empty={t('feed.sections.emptyQuestions')}
        renderItem={(q) => (
          <QuestionRow
            question={q}
            activeTag={null}
            onTag={(tag) => navigate(`/questions?tag=${encodeURIComponent(tag)}`)}
          />
        )}
      />

      <HomeSection
        title={t('feed.sections.projects')}
        to="/projects"
        toLabel={t('feed.sections.allProjects')}
        query={projects}
        limit={3}
        empty={t('feed.sections.emptyProjects')}
        renderItem={(project) => <ProjectCard project={project} />}
      />

      <HomeSection
        title={t('feed.sections.jobs')}
        to="/jobs"
        toLabel={t('feed.sections.allJobs')}
        query={jobs}
        limit={3}
        empty={t('feed.sections.emptyJobs')}
        renderItem={(job) => <JobRow job={job} />}
      />

      <HomeSection
        title={t('feed.sections.missions')}
        to="/missions"
        toLabel={t('feed.sections.allMissions')}
        query={missions}
        limit={3}
        empty={t('feed.sections.emptyMissions')}
        renderItem={(mission) => <MissionRow mission={mission} />}
      />
    </>
  );
}
