import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
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
import { OffersList } from '../../features/missions/OffersList';
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

  const isAuthor = user?.id === m.author.id;
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
          <Avatar name={m.author.name} photoUrl={m.author.photoUrl} size={28} />
          <Link to={`/users/${m.author.id}`}>{m.author.name}</Link>
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

        {isAuthor && m.offers && (
          <section className={own.offers} aria-labelledby="mission-offers-title">
            <h2 id="mission-offers-title" className={styles.sectionTitle}>
              {t('missions.offers.title', { count: m.offers.length })}
            </h2>
            <OffersList
              missionId={m.id}
              offers={m.offers}
              onChange={(offer) =>
                query.setData((current) => ({
                  ...current,
                  offers: (current.offers ?? []).map((o) => (o.id === offer.id ? offer : o)),
                }))
              }
            />
          </section>
        )}

        <div className={styles.report}>
          <ReportButton targetType="MISSION" targetId={m.id} authorId={m.author.id} />
        </div>
      </article>

      <aside className={styles.side}>
        <section className={styles.box}>
          <p className={own.label}>{t('missions.budgetLabel')}</p>
          <p className={own.amount}>
            {m.budget ? formatMoney(m.budget, i18n.language) : t('missions.budgetOpen')}
          </p>
          <p className={styles.boxText}>
            {t('missions.delay', { count: m.delayDays })}
            <span aria-hidden="true"> · </span>
            {t('missions.offerCount', { count: m.offerCount })}
          </p>
          {isAuthor ? (
            <p className={styles.boxText}>{t('missions.yours')}</p>
          ) : m.myOffer ? (
            <>
              <p className={styles.boxText}>{t('missions.offer.sentText')}</p>
              <ApplicationStatusBadge status={m.myOffer} />
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
              myOffer: application.status,
              offerCount: current.offerCount + 1,
            }));
            toast(t('missions.offer.sent'));
          }}
        />
      )}
    </div>
  );
}
