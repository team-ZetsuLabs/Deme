import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Page } from '../../api/types';
import type { ApiQuery } from '../../hooks/useApiQuery';
import { ListRowsSkeleton } from '../../components/skeleton/ListRowsSkeleton';
import styles from './HomeSection.module.css';

export type HomeSectionProps<T> = {
  title: string;
  /** Lien « voir tout » vers l'espace complet. */
  to: string;
  toLabel: string;
  query: ApiQuery<Page<T>>;
  /** Nombre d'éléments affichés dans l'aperçu. */
  limit: number;
  /** Texte quand la section est vide ou indisponible. */
  empty: string;
  renderItem: (item: T) => ReactNode;
};

/**
 * Une section de l'accueil portail : un aperçu d'un espace (questions, offres…), avec un
 * lien « voir tout ». Chaque section charge et échoue de façon indépendante : une section
 * en erreur affiche son message vide, sans casser le reste de la page.
 */
export function HomeSection<T extends { id: number }>({
  title,
  to,
  toLabel,
  query,
  limit,
  empty,
  renderItem,
}: HomeSectionProps<T>) {
  const { t } = useTranslation();
  const items = query.data?.items.slice(0, limit) ?? [];
  const showEmpty = !query.loading && (query.error !== null || items.length === 0);

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <Link to={to} className={styles.more}>
          {toLabel}
        </Link>
      </div>
      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <ListRowsSkeleton count={limit} />}
        {showEmpty && <p className={styles.empty}>{empty}</p>}
        {!query.loading && items.map((item) => <div key={item.id}>{renderItem(item)}</div>)}
      </div>
      {!query.loading && query.data && query.data.total > limit && (
        <Link to={to} className={styles.footLink}>
          {t('feed.seeMore', { count: query.data.total })}
        </Link>
      )}
    </section>
  );
}
