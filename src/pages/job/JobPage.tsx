import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { safeUrl } from '../../components/safeUrl';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { ApplicationStatusBadge } from '../../features/jobs/ApplicationStatusBadge';
import { ApplyDialog } from '../../features/jobs/ApplyDialog';
import { JobFacts } from '../../features/jobs/JobFacts';
import { jobsApi } from '../../features/jobs/jobsApi';
import { SkillMatch } from '../../features/jobs/SkillMatch';
import { ReportButton } from '../../features/moderation/ReportButton';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { JobDetailSkeleton } from '../../components/skeleton/JobDetailSkeleton';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './JobPage.module.css';

export default function JobPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <JobView id={id} /> : <NotFoundPage />;
}

/** Détail d'une offre, correspondance avec la stack (JOB-2) et candidature (JOB-3). */
function JobView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [applying, setApplying] = useState(false);
  const query = useApiQuery(() => jobsApi.get(id), [id]);
  const job = query.data;
  usePageTitle(job?.title ?? t('jobs.pageTitle'));

  if (query.loading) return <JobDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !job) return <ErrorState error={query.error} onRetry={query.reload} />;

  const website = safeUrl(job.companyWebsite);
  const isOwner = !!user && user.username === job.recruiter.username;

  const onApply = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setApplying(true);
  };

  return (
    <div className={styles.layout}>
      <article className={styles.main}>
        <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
          <Link to="/jobs">{t('nav.jobs')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{job.companyName}</span>
        </nav>

        {job.status === 'PENDING' && (
          <p className={styles.pending} role="status">
            {t('jobs.pendingNotice')}
          </p>
        )}
        {job.status === 'REJECTED' && (
          <p className={styles.pending} role="status">
            {job.rejectionReason
              ? t('jobs.rejectedNoticeReason', { reason: job.rejectionReason })
              : t('jobs.rejectedNotice')}
          </p>
        )}
        {job.status === 'CLOSED' && (
          <p className={styles.pending} role="status">
            {t('jobs.closedNotice')}
          </p>
        )}

        <div className={styles.head}>
          <Avatar name={job.companyName} photoUrl={null} size={56} square />
          <div className={styles.headText}>
            <h1 className={styles.title}>{job.title}</h1>
            <p className={styles.company}>
              {website ? (
                <a href={website} rel="noopener noreferrer nofollow">
                  {job.companyName}
                </a>
              ) : (
                job.companyName
              )}
              <span aria-hidden="true"> · </span>
              {t('jobs.published')} <RelativeTime iso={job.createdAt} />
            </p>
            <JobFacts job={job} />
          </div>
        </div>

        <MemberContent html={job.descriptionHtml} className={styles.description} />

        <h2 className={styles.sectionTitle}>{t('jobs.technologies')}</h2>
        <ul className={styles.tags}>
          {job.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        <div className={styles.report}>
          <ReportButton
            targetType="JOB"
            targetId={job.id}
            authorUsername={job.recruiter.username}
          />
        </div>
      </article>

      <aside className={styles.side}>
        <section className={styles.box}>
          {job.myApplication ? (
            <>
              <h2 className={styles.boxTitle}>{t('jobs.applied.title')}</h2>
              <p className={styles.boxText}>{t('jobs.applied.text')}</p>
              <ApplicationStatusBadge status={job.myApplication.status} />
              <Link to="/applications" className={styles.boxLink}>
                {t('jobs.applied.follow')}
              </Link>
            </>
          ) : (
            <>
              <h2 className={styles.boxTitle}>{t('jobs.applyBox.title')}</h2>
              <p className={styles.boxText}>{t('jobs.applyBox.text')}</p>
              <Button
                variant="primary"
                block
                onClick={onApply}
                disabled={job.status !== 'PUBLISHED' || isOwner}
              >
                {t('jobs.applyBox.button')}
              </Button>
            </>
          )}
        </section>

        <section className={styles.box}>
          <h2 className={styles.boxTitle}>{t('jobs.match.title')}</h2>
          {user ? (
            user.technologies.length ? (
              <SkillMatch required={job.technologies} mine={user.technologies} />
            ) : (
              <p className={styles.boxText}>
                {t('jobs.match.noSkills')} <Link to="/profile/edit">{t('profile.edit')}</Link>
              </p>
            )
          ) : (
            <p className={styles.boxText}>
              <Icon name="user" size={14} /> {t('jobs.match.login')}
            </p>
          )}
        </section>
      </aside>

      {user && (
        <ApplyDialog
          open={applying}
          jobId={job.id}
          company={job.companyName}
          user={user}
          onClose={() => setApplying(false)}
          onApplied={(application) => {
            query.setData((current) => ({
              ...current,
              myApplication: { id: application.id, status: application.status },
            }));
            toast(t('jobs.apply.sent', { company: job.companyName }));
          }}
        />
      )}
    </div>
  );
}
