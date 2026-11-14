import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProjectJoinRequest } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { RelativeTime } from '../../components/RelativeTime';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { MemberLine } from './MemberLine';
import { projectsApi } from './projectsApi';
import styles from './ManageRequests.module.css';

export type ManageRequestsProps = {
  projectId: number;
  /** Prévient le parent qu'une demande a été acceptée (l'équipe a changé). */
  onAccepted?: () => void;
};

/** Demandes reçues sur un projet, vues par son porteur : accepter ou refuser (PRJ). */
export function ManageRequests({ projectId, onAccepted }: ManageRequestsProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const query = useApiQuery(() => projectsApi.requests(projectId, page), [projectId, page]);

  const decide = async (item: ProjectJoinRequest, status: 'ACCEPTED' | 'REJECTED') => {
    setPending(item.id);
    try {
      const updated = await projectsApi.decideRequest(projectId, item.id, status);
      query.setData((current) => ({
        ...current,
        items: current.items.map((r) => (r.id === updated.id ? updated : r)),
      }));
      toast(t(status === 'ACCEPTED' ? 'projects.requests.accepted' : 'projects.requests.rejected'));
      if (status === 'ACCEPTED') onAccepted?.();
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setPending(null);
    }
  };

  if (query.loading) return <ListRowsSkeleton count={2} />;
  if (query.error || !query.data) return <ErrorState error={query.error} onRetry={query.reload} />;
  const items = query.data.items;
  if (!items.length) return <StateMessage>{t('projects.requests.empty')}</StateMessage>;

  return (
    <>
      <ul className={styles.list}>
        {items.map((r) => {
          const decided = r.status !== 'PENDING';
          return (
            <li key={r.id} className={styles.item}>
              <div className={styles.head}>
                <MemberLine
                  member={r.applicant}
                  sub={
                    <>
                      {r.roleTitle ?? t('projects.requests.general')}
                      <span aria-hidden="true"> · </span>
                      <RelativeTime iso={r.createdAt} />
                    </>
                  }
                />
                {decided && (
                  <span className={styles.decided}>{t(`projects.requestStatus.${r.status}`)}</span>
                )}
              </div>
              <p className={styles.message}>{r.message}</p>
              {!decided && (
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending === r.id}
                    onClick={() => decide(r, 'REJECTED')}
                    aria-label={t('projects.requests.rejectLabel', {
                      name: r.applicant.displayName,
                    })}
                  >
                    {t('projects.requests.reject')}
                  </Button>
                  <Button
                    size="sm"
                    busy={pending === r.id}
                    onClick={() => decide(r, 'ACCEPTED')}
                    aria-label={t('projects.requests.acceptLabel', {
                      name: r.applicant.displayName,
                    })}
                  >
                    {t('projects.requests.accept')}
                  </Button>
                </div>
              )}
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
