import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { ShareButton } from '../../components/ShareButton';
import { safeUrl } from '../../components/safeUrl';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { JoinDialog } from '../../features/projects/JoinDialog';
import { ManageRequests } from '../../features/projects/ManageRequests';
import { ProjectRoles } from '../../features/projects/ProjectRoles';
import { ProjectStatusBadge } from '../../features/projects/ProjectStatusBadge';
import { ProjectTeam } from '../../features/projects/ProjectTeam';
import { ProjectTypeBadge } from '../../features/projects/ProjectTypeBadge';
import { ProjectUpdates } from '../../features/projects/ProjectUpdates';
import { projectsApi } from '../../features/projects/projectsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ProjectDetailSkeleton } from '../../components/skeleton/ProjectDetailSkeleton';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './ProjectPage.module.css';

export default function ProjectPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <ProjectView id={id} /> : <NotFoundPage />;
}

/** Détail d'un projet (PRJ) : description, rôles, équipe, mises à jour, et demande pour rejoindre. */
function ProjectView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useApiQuery(() => projectsApi.get(id), [id]);
  const project = query.data;
  usePageTitle(project?.title ?? t('projects.pageTitle'));

  if (query.loading) return <ProjectDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !project) return <ErrorState error={query.error} onRetry={query.reload} />;

  const github = safeUrl(project.githubUrl);
  const contact = safeUrl(project.contactUrl);
  const isMember = !!user && project.team.some((m) => m.member.username === user.username);
  const openRoles = project.roles.filter((role) => role.status === 'OPEN');
  const canJoin = project.status === 'OPEN' && !project.canEdit && !isMember && !project.myRequest;

  const onJoin = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setJoining(true);
  };

  const onComplete = async () => {
    setBusy(true);
    try {
      const done = await projectsApi.complete(project.id);
      query.setData((current) => ({ ...current, status: done.status }));
      toast(t('projects.completeDone'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  const onCancelRequest = async () => {
    setBusy(true);
    try {
      await projectsApi.cancelRequest(project.id);
      query.setData((current) => ({ ...current, myRequest: null }));
      toast(t('projects.join.cancelled'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.layout}>
      <article className={styles.main}>
        <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
          <Link to="/projects">{t('nav.projects')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{project.title}</span>
        </nav>

        {project.status === 'COMPLETED' && (
          <p className={styles.notice} role="status">
            {t('projects.completedNotice')}
          </p>
        )}

        <div className={styles.head}>
          <Avatar
            name={project.owner.displayName}
            photoUrl={project.owner.avatarUrl ?? null}
            size={56}
            square
          />
          <div className={styles.headText}>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.owner}>
              {project.owner.displayName}
              <span aria-hidden="true"> · </span>
              {t('projects.updatedAgo')} <RelativeTime iso={project.lastActivityAt} />
            </p>
            <div className={styles.badges}>
              <ProjectTypeBadge type={project.type} />
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>
          <ShareButton title={project.title} path={`/projects/${project.id}`} />
        </div>

        <MemberContent html={project.descriptionHtml} className={styles.description} />

        {project.technologies.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>{t('projects.technologies')}</h2>
            <ul className={styles.tags}>
              {project.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </>
        )}

        {(github || contact) && (
          <div className={styles.links}>
            {github && (
              <a href={github} className={styles.link} rel="noopener noreferrer nofollow">
                <Icon name="github" size={16} /> {t('projects.githubLink')}
              </a>
            )}
            {contact && (
              <a href={contact} className={styles.link} rel="noopener noreferrer nofollow">
                <Icon name="share" size={16} /> {t('projects.contactLink')}
              </a>
            )}
          </div>
        )}

        {project.roles.length > 0 && (
          <section aria-labelledby="project-roles-title">
            <h2 id="project-roles-title" className={styles.sectionTitle}>
              {t('projects.rolesTitle')}
            </h2>
            <ProjectRoles roles={project.roles} />
          </section>
        )}

        <section aria-labelledby="project-updates-title">
          <h2 id="project-updates-title" className={styles.sectionTitle}>
            {t('projects.updatesTitle')}
          </h2>
          <ProjectUpdates projectId={project.id} canPost={project.canPostUpdate} />
        </section>

        {project.canEdit && (
          <section className={styles.requests} aria-labelledby="project-requests-title">
            <h2 id="project-requests-title" className={styles.sectionTitle}>
              {t('projects.requests.title')}
            </h2>
            <ManageRequests projectId={project.id} onAccepted={query.reload} />
          </section>
        )}
      </article>

      <aside className={styles.side}>
        <section className={styles.box}>
          {project.canEdit ? (
            <>
              <h2 className={styles.boxTitle}>{t('projects.owner.box')}</h2>
              <div className={styles.ownerStatus}>
                <ProjectStatusBadge status={project.status} />
              </div>
              {project.status === 'OPEN' && (
                <Link
                  to={`/projects/${project.id}/edit`}
                  className={`${buttonClass({ variant: 'secondary', block: true })} ${styles.spaced}`}
                >
                  {t('projects.owner.edit')}
                </Link>
              )}
              {project.status === 'OPEN' && (
                <Button variant="ghost" block busy={busy} onClick={onComplete}>
                  {t('projects.owner.complete')}
                </Button>
              )}
              <Link to="/projects/mine" className={styles.boxLink}>
                {t('projects.owner.all')}
              </Link>
            </>
          ) : project.myRequest ? (
            <>
              <h2 className={styles.boxTitle}>{t('projects.join.sentTitle')}</h2>
              <p className={styles.boxText}>
                {t(`projects.join.status.${project.myRequest.status}`)}
              </p>
              {project.myRequest.status === 'PENDING' && (
                <Button variant="ghost" block busy={busy} onClick={onCancelRequest}>
                  {t('projects.join.cancel')}
                </Button>
              )}
            </>
          ) : isMember ? (
            <>
              <h2 className={styles.boxTitle}>{t('projects.join.memberTitle')}</h2>
              <p className={styles.boxText}>{t('projects.join.memberText')}</p>
            </>
          ) : (
            <>
              <h2 className={styles.boxTitle}>{t('projects.join.box')}</h2>
              <p className={styles.boxText}>
                {openRoles.length > 0
                  ? t('projects.join.boxRoles', { count: openRoles.length })
                  : t('projects.join.boxText')}
              </p>
              <Button variant="primary" block onClick={onJoin} disabled={!canJoin}>
                {t('projects.join.button')}
              </Button>
            </>
          )}
        </section>

        <section className={styles.box}>
          <h2 className={styles.boxTitle}>
            {t('projects.teamTitle', { count: project.team.length })}
          </h2>
          <ProjectTeam team={project.team} />
        </section>
      </aside>

      {user && (
        <JoinDialog
          open={joining}
          projectId={project.id}
          projectTitle={project.title}
          openRoles={openRoles}
          onClose={() => setJoining(false)}
          onJoined={(request) => {
            query.setData((current) => ({ ...current, myRequest: request }));
            toast(t('projects.join.sent'));
          }}
        />
      )}
    </div>
  );
}
