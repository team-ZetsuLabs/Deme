import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReceivedApplication } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { RelativeTime } from '../../components/RelativeTime';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { ApplicationStatusBadge } from '../jobs/ApplicationStatusBadge';
import { jobsApi } from '../jobs/jobsApi';
import { missionsApi } from './missionsApi';
import { formatMoney } from './money';
import styles from './OffersList.module.css';

export type OffersListProps = { missionId: number };

/** Propositions reçues, vues par l'auteur de la mission : retenir ou refuser (JOB-7). */
export function OffersList({ missionId }: OffersListProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [pending, setPending] = useState<number | null>(null);
  const query = useApiQuery(() => missionsApi.applications(missionId, 0), [missionId]);

  const decide = async (offer: ReceivedApplication, status: 'SHORTLISTED' | 'REJECTED') => {
    setPending(offer.id);
    try {
      const updated = await jobsApi.decide(offer.id, status);
      query.setData((current) => ({
        ...current,
        items: current.items.map((o) => (o.id === updated.id ? updated : o)),
      }));
      toast(t(`missions.offers.${status === 'SHORTLISTED' ? 'shortlisted' : 'rejected'}`));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  if (query.loading) return <ListRowsSkeleton count={2} />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={query.reload} />;
  const offers = query.data.items;
  if (!offers.length) return <StateMessage>{t('missions.offers.empty')}</StateMessage>;

  return (
    <ul className={styles.list}>
      {offers.map((o) => {
        const decided = o.status === 'SHORTLISTED' || o.status === 'REJECTED';
        return (
          <li key={o.id} className={styles.item}>
            <div className={styles.head}>
              <Avatar
                name={o.candidate.displayName}
                photoUrl={o.candidate.avatarUrl ?? null}
                size={36}
              />
              <div className={styles.who}>
                <Link to={`/users/${o.candidate.username}`}>{o.candidate.displayName}</Link>
                <small>
                  {t('question.points', {
                    points: o.candidate.reputation.toLocaleString(i18n.language),
                  })}
                  <span aria-hidden="true"> · </span>
                  <RelativeTime iso={o.createdAt} />
                </small>
              </div>
              <ApplicationStatusBadge status={o.status} />
            </div>
            <p className={styles.message}>{o.message}</p>
            <div className={styles.foot}>
              <span className={styles.terms}>
                {o.proposedBudget
                  ? formatMoney(o.proposedBudget, i18n.language)
                  : t('missions.offers.noTerms')}
              </span>
              {!decided && (
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending === o.id}
                    onClick={() => decide(o, 'REJECTED')}
                  >
                    {t('missions.offers.reject')}
                  </Button>
                  <Button
                    size="sm"
                    busy={pending === o.id}
                    onClick={() => decide(o, 'SHORTLISTED')}
                  >
                    {t('missions.offers.shortlist')}
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
