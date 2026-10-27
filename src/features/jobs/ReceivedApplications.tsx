import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Page, ReceivedApplication } from '../../api/types';
import { api } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Flag } from '../../components/Flag';
import { Pagination } from '../../components/Pagination';
import { RelativeTime } from '../../components/RelativeTime';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { countryName } from '../../i18n/countries';
import { formatMoney } from '../missions/money';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { jobsApi } from './jobsApi';
import styles from './ReceivedApplications.module.css';

export type ReceivedApplicationsProps = {
  /** Candidatures d'une offre ou propositions d'une mission, page par page. */
  load: (page: number) => Promise<Page<ReceivedApplication>>;
  /** Préfixe des textes : candidatures (offre) ou propositions (mission). */
  labels: 'jobs.received' | 'missions.offers';
  /** Appelé après une décision : retenir une proposition passe la mission « en cours ». */
  onDecided?: (application: ReceivedApplication) => void;
};

/**
 * Candidatures reçues, vues par le recruteur de l'offre ou l'auteur de la mission (JOB-7) :
 * profil du candidat, message, CV ou prix proposé, puis retenir ou refuser.
 */
export function ReceivedApplications({ load, labels, onDecided }: ReceivedApplicationsProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  // load change à chaque rendu du parent : on ne suit que la page.
  const query = useApiQuery(() => load(page), [page]);

  const decide = async (item: ReceivedApplication, status: 'SHORTLISTED' | 'REJECTED') => {
    setPending(item.id);
    try {
      const updated = await jobsApi.decide(item.id, status);
      query.setData((current) => ({
        ...current,
        items: current.items.map((o) => (o.id === updated.id ? updated : o)),
      }));
      toast(t(`${labels}.${status === 'SHORTLISTED' ? 'shortlisted' : 'rejected'}`));
      onDecided?.(updated);
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  if (query.loading) return <ListRowsSkeleton count={2} />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={query.reload} />;
  const items = query.data.items;
  if (!items.length) return <StateMessage>{t(`${labels}.empty`)}</StateMessage>;

  return (
    <>
      <ul className={styles.list}>
        {items.map((o) => {
          const c = o.candidate;
          const decided = o.status === 'SHORTLISTED' || o.status === 'REJECTED';
          const place = countryName(c.countryCode ?? null, i18n.language);
          return (
            <li key={o.id} className={styles.item}>
              <div className={styles.head}>
                <Avatar name={c.displayName} photoUrl={c.avatarUrl ?? null} size={36} />
                <div className={styles.who}>
                  <Link to={`/users/${c.username}`}>{c.displayName}</Link>
                  <small>
                    {place && (
                      <>
                        <Flag code={c.countryCode} width={14} /> {place}
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {t('question.points', { points: c.reputation.toLocaleString(i18n.language) })}
                    <span aria-hidden="true"> · </span>
                    <RelativeTime iso={o.createdAt} />
                  </small>
                </div>
                <ApplicationStatusBadge status={o.status} />
              </div>
              {c.technologies.length > 0 && (
                <ul className={styles.tags} aria-label={t('jobs.technologies')}>
                  {c.technologies.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              )}
              <p className={styles.message}>{o.message}</p>
              <div className={styles.foot}>
                {o.target.type === 'MISSION' ? (
                  <span className={styles.terms}>
                    {o.proposedBudget
                      ? formatMoney(o.proposedBudget, i18n.language)
                      : t('missions.offers.noTerms')}
                  </span>
                ) : o.hasCv ? (
                  <a
                    className={styles.cv}
                    href={jobsApi.cvUrl(o.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // En mode mock, le serveur ne sert pas de fichier.
                      if (api.mode === 'mock') {
                        e.preventDefault();
                        toast(t('jobs.received.mockCv'));
                      }
                    }}
                  >
                    {t('jobs.received.cv')}
                  </a>
                ) : (
                  <span className={styles.terms}>{t('jobs.received.noCv')}</span>
                )}
                {!decided && (
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending === o.id}
                      onClick={() => decide(o, 'REJECTED')}
                      aria-label={t(`${labels}.rejectLabel`, { name: c.displayName })}
                    >
                      {t(`${labels}.reject`)}
                    </Button>
                    <Button
                      size="sm"
                      busy={pending === o.id}
                      onClick={() => decide(o, 'SHORTLISTED')}
                      aria-label={t(`${labels}.shortlistLabel`, { name: c.displayName })}
                    >
                      {t(`${labels}.shortlist`)}
                    </Button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination
        page={query.data.page}
        size={query.data.size}
        total={query.data.total}
        onChange={setPage}
      />
    </>
  );
}
