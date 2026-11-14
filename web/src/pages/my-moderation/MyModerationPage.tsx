import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ModerationTarget } from '../../api/types';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { RelativeTime } from '../../components/RelativeTime';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import { StateMessage } from '../../components/StateMessage';
import { appealsApi } from '../../features/moderation/appealsApi';
import { HiddenNotice } from '../../features/moderation/HiddenNotice';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './MyModerationPage.module.css';

/** Adresse du contenu visé ; null pour un profil (le contrat ne donne que son identifiant). */
function targetLink(target: ModerationTarget): string | null {
  switch (target.type) {
    case 'QUESTION':
      return `/questions/${target.id}`;
    case 'ANSWER':
      return target.questionId ? `/questions/${target.questionId}#answer-${target.id}` : null;
    case 'JOB':
      return `/jobs/${target.id}`;
    case 'MISSION':
      return `/missions/${target.id}`;
    default:
      return null;
  }
}

/**
 * Mes contenus signalés ou masqués (MOD-2, MOD-3) : l'auteur voit pourquoi, et peut contester
 * un masquage devant l'équipe. La file des Référents est dans le back office.
 */
export default function MyModerationPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => appealsApi.mine(page), [page]);
  usePageTitle(t('myModeration.pageTitle'));

  return (
    <>
      <h1 className={styles.title}>{t('myModeration.pageTitle')}</h1>
      <p className={styles.lead}>{t('myModeration.lead')}</p>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <ListRowsSkeleton count={2} />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('myModeration.empty')}</StateMessage>
        )}
        {!query.loading && query.data && query.data.items.length > 0 && (
          <ul className={styles.list}>
            {query.data.items.map((item) => {
              const link = targetLink(item.target);
              const hidden = item.status === 'HIDDEN' || item.status === 'APPEALED';
              return (
                <li key={item.caseId} className={styles.item}>
                  <div className={styles.head}>
                    <div className={styles.body}>
                      <span className={styles.kind}>
                        {t(`myModeration.kind.${item.target.type}`)}
                      </span>
                      {link ? (
                        <Link to={link}>{item.target.title}</Link>
                      ) : (
                        <b>{item.target.title}</b>
                      )}
                      {item.target.excerpt && (
                        <p className={styles.excerpt}>{item.target.excerpt}</p>
                      )}
                      <small>
                        {t('myModeration.updated')} <RelativeTime iso={item.updatedAt} />
                      </small>
                    </div>
                    <span className={`${styles.status} ${styles[item.status]}`}>
                      {t(`myModeration.status.${item.status}`)}
                    </span>
                  </div>
                  {hidden && (
                    <HiddenNotice
                      item={item}
                      onAppealed={(updated) =>
                        query.setData((current) => ({
                          ...current,
                          items: current.items.map((i) =>
                            i.caseId === updated.caseId ? updated : i,
                          ),
                        }))
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
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
