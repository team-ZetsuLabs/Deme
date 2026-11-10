import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { Avatar } from '../../components/Avatar';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { MemberContent } from '../../components/MemberContent';
import { ShareButton } from '../../components/ShareButton';
import { JobDetailSkeleton } from '../../components/skeleton/JobDetailSkeleton';
import { useToast } from '../../components/useToast';
import { errorMessage } from '../../api/errorMessage';
import { useSession } from '../../features/auth/useSession';
import { ParticipationPanel } from '../../features/playtests/ParticipationPanel';
import { PlaytestProgress } from '../../features/playtests/PlaytestProgress';
import { playtestsApi } from '../../features/playtests/playtestsApi';
import { CloseListingButton } from '../../features/jobs/CloseListingButton';
import { ReportButton } from '../../features/moderation/ReportButton';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../job/JobPage.module.css';
import own from './PlaytestPage.module.css';

export default function PlaytestPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <PlaytestView id={id} /> : <NotFoundPage />;
}

/** Détail d'une campagne (TST) : rejoindre comme testeur, ou la piloter si on en est le porteur. */
function PlaytestView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const query = useApiQuery(() => playtestsApi.get(id), [id]);
  const p = query.data;
  usePageTitle(p?.appName ?? t('playtests.pageTitle'));

  if (query.loading) return <JobDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !p) return <ErrorState error={query.error} onRetry={query.reload} />;

  const isOwner = user?.username === p.owner.username;
  const facts: [string, string][] = [
    [t('playtests.facts.testers'), String(p.testersTarget)],
    [t('playtests.facts.days'), String(p.requiredDays)],
    [t('playtests.facts.spots'), p.spotsLeft > 0 ? String(p.spotsLeft) : t('playtests.full')],
  ];

  return (
    <div className={styles.layout}>
      <article className={styles.main}>
        <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
          <Link to="/playtests">{t('nav.playtests')}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.appName}</span>
        </nav>

        {p.status !== 'ACTIVE' && p.status !== 'COMPLETED' && (
          <p className={styles.pending} role="status">
            {t(`playtests.statusNotice.${p.status}`)}
            {p.reviewNote ? ` ${p.reviewNote}` : ''}
          </p>
        )}

        <div className={own.header}>
          <Avatar name={p.appName} photoUrl={p.iconUrl ?? null} size={56} square />
          <div>
            <h1 className={own.title}>{p.appName}</h1>
            <p className={own.pkg}>
              {t(`playtests.platform.${p.platform}`)}
              {p.packageName ? ` · ${p.packageName}` : ''}
            </p>
          </div>
          <ShareButton title={p.appName} path={`/playtests/${p.id}`} />
        </div>

        <p className={own.owner}>
          <Avatar name={p.owner.displayName} photoUrl={p.owner.avatarUrl ?? null} size={24} />
          <Link to={`/users/${p.owner.username}`}>{p.owner.displayName}</Link>
        </p>

        <MemberContent html={p.descriptionHtml} className={styles.description} />

        {p.instructions && (
          <>
            <h2 className={styles.sectionTitle}>{t('playtests.instructions')}</h2>
            <p className={own.instructions}>{p.instructions}</p>
          </>
        )}

        <div className={styles.report}>
          <ReportButton targetType="PLAYTEST" targetId={p.id} authorUsername={p.owner.username} />
        </div>
      </article>

      <aside className={styles.side}>
        <section className={styles.box}>
          <dl className={own.facts}>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <PlaytestProgress progress={p.progress} />
        </section>

        {isOwner ? (
          <section className={styles.box}>
            <p className={own.yours}>{t('playtests.owner.yours')}</p>
            {p.canEdit && (
              <Link
                to={`/playtests/${p.id}/edit`}
                className={buttonClass({ variant: 'secondary', block: true })}
              >
                {t('playtests.owner.edit')}
              </Link>
            )}
            {p.canSubmit && (
              <button
                type="button"
                className={buttonClass({ variant: 'primary', block: true })}
                onClick={async () => {
                  try {
                    const updated = await playtestsApi.submit(p.id);
                    query.setData((c) => ({ ...c, ...updated }));
                    toast(t('playtests.owner.submitted'));
                  } catch (error) {
                    toast(errorMessage(t, error));
                  }
                }}
              >
                {t('playtests.owner.submit')}
              </button>
            )}
            {p.canClose && (
              <CloseListingButton
                labels="playtests.owner.close"
                onConfirm={async () => {
                  const closed = await playtestsApi.close(p.id);
                  query.setData((c) => ({ ...c, ...closed }));
                  toast(t('playtests.owner.closed'));
                }}
              />
            )}
          </section>
        ) : (
          <ParticipationPanel playtest={p} onChange={(updated) => query.setData(() => updated)} />
        )}
        <p className={own.notice}>{t('playtests.disclaimer')}</p>
      </aside>
    </div>
  );
}
