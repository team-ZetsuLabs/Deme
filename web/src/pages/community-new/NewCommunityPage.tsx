import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { RelativeTime } from '../../components/RelativeTime';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { useSession } from '../../features/auth/useSession';
import { communitiesApi } from '../../features/communities/communitiesApi';
import { ProposalForm } from '../../features/communities/ProposalForm';
import { ProposalStatusBadge } from '../../features/communities/ProposalStatusBadge';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NewCommunityPage.module.css';

/**
 * Proposer une communauté (COM-2). Les Référents proposent, l'équipe valide depuis le
 * back office, comme les offres d'emploi. Réservée aux membres connectés (voir la route).
 */
export default function NewCommunityPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  usePageTitle(t('communities.propose.pageTitle'));

  if (user?.level !== 'REFERENT') {
    return (
      <section className={styles.panel}>
        <h1 className={styles.title}>{t('communities.propose.pageTitle')}</h1>
        <StateMessage
          action={
            <Link to="/communities" className={buttonClass({ variant: 'secondary' })}>
              {t('communities.propose.back')}
            </Link>
          }
        >
          {t('communities.propose.referentsOnly')}
        </StateMessage>
      </section>
    );
  }
  return <ProposalView />;
}

function ProposalView() {
  const { t } = useTranslation();
  const toast = useToast();
  const query = useApiQuery(() => communitiesApi.myProposals(), []);

  return (
    <>
      <section className={styles.panel}>
        <h1 className={styles.title}>{t('communities.propose.pageTitle')}</h1>
        <p className={styles.lead}>{t('communities.propose.lead')}</p>
        <ProposalForm
          onProposed={(proposal) => {
            query.setData((items) => [proposal, ...items]);
            toast(t('communities.propose.sent'));
            requestAnimationFrame(() => document.getElementById('my-proposals')?.focus());
          }}
        />
      </section>

      <section
        id="my-proposals"
        tabIndex={-1}
        className={`${styles.panel} ${styles.list}`}
        aria-labelledby="my-proposals-title"
      >
        <h2 id="my-proposals-title" className={styles.subTitle}>
          {t('communities.propose.mine')}
        </h2>
        {query.loading && <ListRowsSkeleton count={2} />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && !query.error && !query.data?.length && (
          <p className={styles.muted}>{t('communities.propose.none')}</p>
        )}
        {!query.loading && !!query.data?.length && (
          <ul className={styles.proposals}>
            {query.data.map((p) => (
              <li key={p.id} className={styles.proposal}>
                <div className={styles.proposalBody}>
                  <b>
                    {p.status === 'APPROVED' && p.slug ? (
                      <Link to={`/communities/${p.slug}`}>{p.name}</Link>
                    ) : (
                      p.name
                    )}
                  </b>
                  <small>
                    {t(`communities.kinds.${p.kind}`)} · <RelativeTime iso={p.createdAt} />
                  </small>
                  {p.status === 'REJECTED' && p.rejectionReason && (
                    <p className={styles.reason}>
                      {t('communities.propose.reason', { reason: p.rejectionReason })}
                    </p>
                  )}
                </div>
                <ProposalStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
