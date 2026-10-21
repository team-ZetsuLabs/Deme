import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '../../api/provisional-types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { groupByDate } from '../../features/notifications/groupByDate';
import { NotificationItem } from '../../features/notifications/NotificationItem';
import { notificationsApi } from '../../features/notifications/notificationsApi';
import { useUnread } from '../../features/notifications/useUnread';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { NotificationRowsSkeleton } from '../../components/skeleton/NotificationRowsSkeleton';
import styles from './NotificationsPage.module.css';

/** Notifications dans l'application (NOT-1). Réservée aux membres connectés (voir la route). */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const unread = useUnread();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const query = useApiQuery(() => notificationsApi.list(page), [page]);
  usePageTitle(t('notifications.pageTitle'));

  const markLocal = (match: (n: AppNotification) => boolean) =>
    query.setData((current) => ({
      ...current,
      items: current.items.map((n) => (match(n) ? { ...n, read: true } : n)),
    }));

  const onOpen = (n: AppNotification) => {
    if (n.read) return;
    markLocal((item) => item.id === n.id);
    unread.setCount((c) => c - 1);
    // En arrière-plan : la navigation vers le contenu ne doit pas attendre le serveur.
    notificationsApi.markRead({ ids: [n.id] }).catch(() => unread.refresh());
  };

  const onReadAll = async () => {
    setBusy(true);
    try {
      await notificationsApi.markRead({ all: true });
      markLocal(() => true);
      unread.setCount(() => 0);
      toast(t('notifications.allRead'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setBusy(false);
    }
  };

  const hasUnread = unread.count > 0 || !!query.data?.items.some((n) => !n.read);

  return (
    <>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{t('notifications.pageTitle')}</h1>
        {hasUnread && (
          <Button size="sm" busy={busy} onClick={onReadAll}>
            {t('notifications.readAll')}
          </Button>
        )}
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <NotificationRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('notifications.empty')}</StateMessage>
        )}
        {!query.loading &&
          query.data &&
          groupByDate(query.data.items).map(({ group, items }) => (
            <section key={group} aria-labelledby={`notif-group-${group}`}>
              <h2 id={`notif-group-${group}`} className={styles.group}>
                {t(`notifications.groups.${group}`)}
              </h2>
              <ul className={styles.list}>
                {items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onOpen={() => onOpen(n)} />
                ))}
              </ul>
            </section>
          ))}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={setPage}
        />
      )}
    </>
  );
}
