import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { MissionDetailSkeleton } from '../../components/skeleton/MissionDetailSkeleton';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { ApplicationStatusBadge } from '../../features/jobs/ApplicationStatusBadge';
import { MissionFacts } from '../../features/missions/MissionFacts';
import { missionsApi } from '../../features/missions/missionsApi';
import { formatMoney } from '../../features/missions/money';
import { OfferDialog } from '../../features/missions/OfferDialog';
import { CloseListingButton } from '../../features/jobs/CloseListingButton';
import { ReceivedApplications } from '../../features/jobs/ReceivedApplications';
import { ReportButton } from '../../features/moderation/ReportButton';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../job/JobPage.module.css';
import own from './MissionPage.module.css';

export default function MissionPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <MissionView id={id} /> : <NotFoundPage />;
}

/** Détail d'une mission (JOB-5) : se proposer, ou gérer les propositions si on en est l'auteur. */
function MissionView({ id }: { id: number }) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [offering, setOffering] = useState(false);
  const query = useApiQuery(() => missionsApi.get(id), [id]);
  const m = query.data;
  usePageTitle(m?.title ?? t('missions.pageTitle'));

  if (query.loading) return <MissionDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !m) return <ErrorState error={query.error} onRetry={query.reload} />;

  const isAuthor = user?.username === m.author.username;
  const open = m.status === 'OPEN';

  const onOffer = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setOffering(true);
  };

  return (
    <div className={styles.layout}>
      <article className={styles.main}>
        <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
          <Link to="/missions">{t('nav.missions')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t(`missions.kind.${m.kind}`)}</span>
        </nav>

        {!open && (
          <p className={styles.pending} role="status">
            {t(`missions.statusNotice.${m.status}`)}
          </p>
        )}

        <MissionFacts mission={m} />
        <h1 className={`${styles.title} ${own.title}`}>{m.title}</h1>
        <p className={own.author}>
          <Avatar name={m.author.displayName} photoUrl={m.author.avatarUrl ?? null} size={28} />
          <Link to={`/users/${m.author.username}`}>{m.author.displayName}</Link>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={m.createdAt} />
        </p>

        <MemberContent html={m.descriptionHtml} className={styles.description} />

        <h2 className={styles.sectionTitle}>{t('jobs.technologies')}</h2>
        <ul className={styles.tags}>
          {m.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>

        {isAuthor && (
          <section className={own.offers} aria-labelledby="mission-offers-title">
            <h2 id="mission-offers-title" className={styles.sectionTitle}>
              {t('missions.offers.title', { count: m.applicationCount })}
            </h2>
            <ReceivedApplications
              labels="missions.offers"
              load={(page) => missionsApi.applications(m.id, page)}
              // Retenir une proposition passe la mission « en cours » : on relit son statut.
              onDecided={(application) => {
                if (application.status === 'SHORTLISTED') query.reload();
              }}
            />
          </section>
        )}

        <div className={styles.report}>
          <ReportButton targetType="MISSION" targetId={m.id} authorUsername={m.author.username} />
        </div>
      </article>

      <aside className={styles.side}>
        <section className={styles.box}>
          <p className={own.label}>{t('missions.budgetLabel')}</p>
          <p className={own.amount}>{formatMoney(m.budget, i18n.language)}</p>
          <p className={styles.boxText}>
            {t('missions.delay', { count: m.durationDays })}
            <span aria-hidden="true"> · </span>
            {t('missions.offerCount', { count: m.applicationCount })}
          </p>
          {isAuthor ? (
            <>
              <p className={styles.boxText}>{t('missions.yours')}</p>
              {m.canEdit && open && (
                <Link
                  to={`/missions/${m.id}/edit`}
                  className={`${buttonClass({ variant: 'secondary', block: true })} ${styles.editLink}`}
                >
                  {t('missions.edit.button')}
                </Link>
              )}
              {m.status !== 'CLOSED' && (
                <CloseListingButton
                  labels="missions.close"
                  onConfirm={async () => {
                    const closed = await missionsApi.close(m.id);
                    query.setData((current) => ({ ...current, status: closed.status }));
                    toast(t('missions.close.done'));
                  }}
                />
              )}
            </>
          ) : m.myApplication ? (
            <>
              <p className={styles.boxText}>{t('missions.offer.sentText')}</p>
              <ApplicationStatusBadge status={m.myApplication.status} />
              <Link to="/applications" className={styles.boxLink}>
                {t('jobs.applied.follow')}
              </Link>
            </>
          ) : (
            <Button variant="primary" block onClick={onOffer} disabled={!open}>
              {t('missions.offer.button')}
            </Button>
          )}
        </section>
        <p className={own.notice}>{t('missions.paymentNotice')}</p>
      </aside>

      {user && !isAuthor && (
        <OfferDialog
          open={offering}
          missionId={m.id}
          budget={m.budget}
          onClose={() => setOffering(false)}
          onSent={(application) => {
            query.setData((current) => ({
              ...current,
              myApplication: { id: application.id, status: application.status },
              applicationCount: current.applicationCount + 1,
            }));
            toast(t('missions.offer.sent'));
          }}
        />
      )}
    </div>
  );
}
