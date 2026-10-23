import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MissionOffer } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { RelativeTime } from '../../components/RelativeTime';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { ApplicationStatusBadge } from '../jobs/ApplicationStatusBadge';
import { missionsApi } from './missionsApi';
import { formatMoney } from './money';
import styles from './OffersList.module.css';

export type OffersListProps = {
  missionId: number;
  offers: MissionOffer[];
  onChange: (offer: MissionOffer) => void;
};

/** Propositions reçues, vues par l'auteur de la mission : retenir ou refuser (JOB-7). */
export function OffersList({ missionId, offers, onChange }: OffersListProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [pending, setPending] = useState<number | null>(null);

  const decide = async (offer: MissionOffer, status: 'SHORTLISTED' | 'REJECTED') => {
    setPending(offer.id);
    try {
      onChange(await missionsApi.decide(missionId, offer.id, { status }));
      toast(t(`missions.offers.${status === 'SHORTLISTED' ? 'shortlisted' : 'rejected'}`));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  if (!offers.length) return <StateMessage>{t('missions.offers.empty')}</StateMessage>;

  return (
    <ul className={styles.list}>
      {offers.map((o) => {
        const decided = o.status === 'SHORTLISTED' || o.status === 'REJECTED';
        return (
          <li key={o.id} className={styles.item}>
            <div className={styles.head}>
              <Avatar name={o.member.displayName} photoUrl={o.member.avatarUrl ?? null} size={36} />
              <div className={styles.who}>
                <Link to={`/users/${o.member.username}`}>{o.member.displayName}</Link>
                <small>
                  {t('question.points', {
                    points: o.member.reputation.toLocaleString(i18n.language),
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
                {[
                  o.price && formatMoney(o.price, i18n.language),
                  o.delayDays && t('missions.delay', { count: o.delayDays }),
                ]
                  .filter(Boolean)
                  .join(', ') || t('missions.offers.noTerms')}
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
