import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { Pagination } from '../../components/Pagination';
import { StateMessage } from '../../components/StateMessage';
import { FeedFilters } from '../../features/questions/FeedFilters';
import { QuestionRow } from '../../features/questions/QuestionRow';
import { questionsApi } from '../../features/questions/questionsApi';
import { useQuestionFilters } from '../../features/questions/useQuestionFilters';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { countryName } from '../../i18n/countries';
import { QuestionRowsSkeleton } from '../../components/skeleton/QuestionRowsSkeleton';
import styles from './QuestionsPage.module.css';

/** Fil des questions (QA-6), avec recherche (QA-7) et filtres de contexte (QA-2). */
export default function QuestionsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { filters, update, activeCount } = useQuestionFilters();
  const [quickTitle, setQuickTitle] = useState('');
  usePageTitle(t('questions.pageTitle'));

  const query = useApiQuery(() => questionsApi.list(filters), [filters]);

  const onQuickAsk = (e: FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    navigate(title ? `/questions/ask?title=${encodeURIComponent(title)}` : '/questions/ask');
  };

  const onTag = (tag: string) => update({ tag: filters.tag === tag ? null : tag });

  const activeLabels = [
    filters.tag && t('questions.filters.tag', { tag: filters.tag }),
    filters.q && t('questions.filters.search', { q: filters.q }),
    filters.country && countryName(filters.country, i18n.language),
    filters.operator && t(`context.operator.${filters.operator}`),
  ].filter(Boolean);

  return (
    <>
      <section className={`${styles.panel} ${styles.ask}`} aria-labelledby="ask-heading">
        <h1 id="ask-heading" className={styles.askTitle}>
          {t('questions.ask.heading')}
        </h1>
        <p className={styles.lead}>{t('questions.lead')}</p>
        <form className={styles.askForm} onSubmit={onQuickAsk}>
          <input
            className={styles.askInput}
            aria-labelledby="ask-heading"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={t('questions.ask.placeholder')}
            maxLength={150}
          />
          <Button type="submit" variant="primary">
            {t('questions.ask.submit')}
          </Button>
        </form>
      </section>

      <div className={styles.toolbar}>
        <h2 className={styles.feedTitle}>
          {filters.tag ? t('questions.titleTag', { tag: filters.tag }) : t('questions.title')}
        </h2>
      </div>
      <FeedFilters filters={filters} update={update} />

      {activeCount > 0 && (
        <div className={styles.activeFilter}>
          <span>
            {activeLabels.join(', ')}
            {query.data && `, ${t('questions.filters.results', { count: query.data.total })}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update({ tag: null, q: null, country: null, operator: null })}
          >
            {t('questions.filters.reset')}
          </Button>
        </div>
      )}

      <div className={styles.panel} aria-live="polite" aria-busy={query.loading}>
        {query.loading && <QuestionRowsSkeleton />}
        {!query.loading && query.error !== null && (
          <ErrorState error={query.error} onRetry={query.reload} />
        )}
        {!query.loading && query.data && query.data.items.length === 0 && (
          <StateMessage
            action={
              <Link to="/questions/ask" className={buttonClass({ variant: 'primary' })}>
                {t('questions.ask.submit')}
              </Link>
            }
          >
            {t('questions.empty')}
          </StateMessage>
        )}
        {!query.loading &&
          query.data?.items.map((q) => (
            <QuestionRow key={q.id} question={q} activeTag={filters.tag} onTag={onTag} />
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
