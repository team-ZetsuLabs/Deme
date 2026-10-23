import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CommunitySummary, MembershipResult } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { Segmented } from '../../components/Segmented';
import { StateMessage } from '../../components/StateMessage';
import { CommunityRowsSkeleton } from '../../components/skeleton/CommunityRowsSkeleton';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { useSession } from '../../features/auth/useSession';
import {
  communitiesApi,
  type CommunityKindFilter,
} from '../../features/communities/communitiesApi';
import { CommunityMark } from '../../features/communities/CommunityMark';
import { CommunityRow } from '../../features/communities/CommunityRow';
import { useCommunityFilters } from '../../features/communities/useCommunityFilters';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './CommunitiesPage.module.css';

const KINDS: CommunityKindFilter[] = ['all', 'COUNTRY', 'TECH'];

/** Communautés par pays et par technologie (COM-1). */
export default function CommunitiesPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const { filters, update } = useCommunityFilters();
  const [search, setSearch] = useState(filters.q ?? '');
  const query = useApiQuery(() => communitiesApi.list(filters), [filters]);
  usePageTitle(t('communities.pageTitle'));

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ q: search.trim() || null });
  };

  // Rejoindre depuis la liste met à jour la ligne et « Mes communautés ».
  const [mineVersion, setMineVersion] = useState(0);
  const onMembership = (slug: string, result: MembershipResult) =>
    query.setData((page) => ({
      ...page,
      items: page.items.map((c) => (c.slug === slug ? { ...c, ...result } : c)),
    }));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{t('communities.title')}</h1>
          <p className={styles.lead}>{t('communities.lead')}</p>
        </div>
        {user?.level === 'REFERENT' ? (
          <Link to="/communities/new" className={buttonClass({ variant: 'secondary' })}>
            {t('communities.propose.button')}
          </Link>
        ) : (
          <p className={styles.note}>{t('communities.propose.note')}</p>
        )}
      </div>

      {user && <MyCommunities version={mineVersion} />}

      <div className={styles.filters}>
        <Segmented<CommunityKindFilter>
          label={t('communities.filters.kind')}
          value={filters.kind}
          onChange={(kind) => update({ kind })}
          options={KINDS.map((kind) => ({
            value: kind,
            label: t(`communities.filters.kinds.${kind}`),
          }))}
        />
        <form className={styles.search} onSubmit={onSearch} role="search">
          <label className="sr-only" htmlFor="communities-search">
            {t('communities.filters.search')}
          </label>
          <input
            id="communities-search"
            className={styles.input}
            value={search}
            placeholder={t('communities.filters.searchPlaceholder')}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" size="sm">
            {t('communities.filters.apply')}
          </Button>
        </form>
      </div>

      <div className={styles.panel} aria-busy={query.loading}>
        {query.loading && <CommunityRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data?.items.length === 0 && (
          <StateMessage>{t('communities.empty')}</StateMessage>
        )}
        {!query.loading &&
          query.data?.items.map((c) => (
            <CommunityRow
              key={c.slug}
              community={c}
              onMembership={(result) => {
                onMembership(c.slug, result);
                setMineVersion((v) => v + 1);
              }}
            />
          ))}
      </div>

      {query.data && (
        <Pagination
          page={query.data.page}
          size={query.data.size}
          total={query.data.total}
          onChange={(page) => {
            update({ page });
            window.scrollTo(0, 0);
          }}
        />
      )}
    </>
  );
}

/** Raccourcis vers les communautés du membre connecté. */
function MyCommunities({ version }: { version: number }) {
  const { t } = useTranslation();
  const query = useApiQuery(() => communitiesApi.mine(), [version]);
  const items: CommunitySummary[] = query.data ?? [];

  return (
    <section className={styles.mine} aria-labelledby="my-communities-title">
      <h2 id="my-communities-title" className={styles.mineTitle}>
        {t('communities.mine')}
      </h2>
      {query.loading && (
        <div className={styles.chips} aria-hidden="true">
          <Skeleton width={120} height={36} radius="md" />
          <Skeleton width={140} height={36} radius="md" />
        </div>
      )}
      {!query.loading && query.error !== null && (
        <p className={styles.mineText}>{t('communities.mineError')}</p>
      )}
      {!query.loading && !query.error && items.length === 0 && (
        <p className={styles.mineText}>{t('communities.mineEmpty')}</p>
      )}
      {!query.loading && items.length > 0 && (
        <ul className={styles.chips}>
          {items.map((c) => (
            <li key={c.slug}>
              <Link to={`/communities/${c.slug}`} className={styles.chip}>
                <CommunityMark community={c} />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
