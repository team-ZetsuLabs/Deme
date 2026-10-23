import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import type { AuthorSummary, CommunityDetail } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { Tabs } from '../../components/Tabs';
import { CommunitySkeleton } from '../../components/skeleton/CommunitySkeleton';
import { QuestionRowsSkeleton } from '../../components/skeleton/QuestionRowsSkeleton';
import { communitiesApi } from '../../features/communities/communitiesApi';
import { CommunityMark } from '../../features/communities/CommunityMark';
import { JoinButton } from '../../features/communities/JoinButton';
import { QuestionRow } from '../../features/questions/QuestionRow';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './CommunityPage.module.css';

type CommunityTab = 'questions' | 'members' | 'rules';

/** Page d'une communauté (COM-1) : ses questions, ses membres, ses règles. */
export default function CommunityPage() {
  const { slug } = useParams();
  return slug ? <CommunityView slug={slug} /> : <NotFoundPage />;
}

/** Lien « Poser une question » prérempli avec le pays ou l'étiquette de la communauté. */
function askLink(c: CommunityDetail): string {
  const params = new URLSearchParams();
  if (c.countryCode) params.set('country', c.countryCode);
  if (c.tag) params.set('tag', c.tag);
  const qs = params.toString();
  return `/questions/ask${qs ? `?${qs}` : ''}`;
}

function CommunityView({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<CommunityTab>('questions');
  const query = useApiQuery(() => communitiesApi.get(slug), [slug]);
  const c = query.data;
  usePageTitle(c?.name ?? t('communities.pageTitle'));

  if (query.loading) return <CommunitySkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !c) return <ErrorState error={query.error} onRetry={query.reload} />;

  const fmt = (n: number) => n.toLocaleString(i18n.language);

  return (
    <>
      <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
        <Link to="/communities">{t('nav.communities')}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{c.name}</span>
      </nav>

      <section className={styles.panel}>
        <div className={styles.head}>
          <CommunityMark community={c} size="lg" />
          <div className={styles.identity}>
            <h1 className={styles.name}>{c.name}</h1>
            <p className={styles.kind}>
              {t(`communities.kinds.${c.kind}`)}
              {c.tag && <span className={styles.tag}>{c.tag}</span>}
            </p>
            <p className={styles.desc}>{c.description}</p>
            <p className={styles.stats}>
              {t('communities.members', { count: c.memberCount, formatted: fmt(c.memberCount) })}
              <span aria-hidden="true"> · </span>
              {t('communities.questions', {
                count: c.questionCount,
                formatted: fmt(c.questionCount),
              })}
            </p>
          </div>
          <div className={styles.actions}>
            <JoinButton
              slug={c.slug}
              name={c.name}
              joined={c.joined}
              memberCount={c.memberCount}
              onChange={(result) => query.setData((current) => ({ ...current, ...result }))}
            />
            <Link to={askLink(c)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              {t('communities.ask')}
            </Link>
          </div>
        </div>

        <Tabs<CommunityTab>
          label={t('communities.sections')}
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'questions', label: t('communities.tabs.questions') },
            { key: 'members', label: t('communities.tabs.members') },
            { key: 'rules', label: t('communities.tabs.rules') },
          ]}
        >
          {tab === 'questions' && <CommunityQuestions slug={c.slug} />}
          {tab === 'members' && (
            <div className={styles.members}>
              <PeopleList title={t('communities.referents')} people={c.referents} />
              <PeopleList title={t('communities.topMembers')} people={c.topMembers} />
            </div>
          )}
          {tab === 'rules' && (
            <div className={styles.rules}>
              {c.rules.length > 0 ? (
                <ol className={styles.ruleList}>
                  {c.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              ) : (
                <p className={styles.muted}>{t('communities.noRules')}</p>
              )}
              <p className={styles.muted}>
                {t('communities.generalRules')}{' '}
                <Link to="/rules">{t('communities.rulesLink')}</Link>
              </p>
            </div>
          )}
        </Tabs>
      </section>
    </>
  );
}

function CommunityQuestions({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const query = useApiQuery(() => communitiesApi.questions(slug, page), [slug, page]);

  if (query.loading) return <QuestionRowsSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />;
  if (!query.data?.items.length) return <StateMessage>{t('communities.noQuestions')}</StateMessage>;

  return (
    <>
      <div className={styles.questions}>
        {query.data.items.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            activeTag={null}
            onTag={(tag) => navigate(`/questions?tag=${encodeURIComponent(tag)}`)}
          />
        ))}
      </div>
      <Pagination
        page={query.data.page}
        size={query.data.size}
        total={query.data.total}
        onChange={setPage}
      />
    </>
  );
}

function PeopleList({ title, people }: { title: string; people: AuthorSummary[] }) {
  const { t, i18n } = useTranslation();
  return (
    <section>
      <h2 className={styles.peopleTitle}>{title}</h2>
      {people.length === 0 ? (
        <p className={styles.muted}>{t('communities.nobody')}</p>
      ) : (
        <ul className={styles.people}>
          {people.map((p) => (
            <li key={p.username} className={styles.person}>
              <Avatar name={p.displayName} photoUrl={p.avatarUrl ?? null} size={36} />
              <span>
                <Link to={`/users/${p.username}`}>{p.displayName}</Link>
                <small>
                  {t(`levels.${p.level}`)} ·{' '}
                  {t('question.points', { points: p.reputation.toLocaleString(i18n.language) })}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
