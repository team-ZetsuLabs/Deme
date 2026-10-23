import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Segmented } from '../../components/Segmented';
import { countryOptions } from '../../i18n/countries';
import { OPERATORS } from './context';
import type { QuestionFilters } from './questionsApi';
import type { useQuestionFilters } from './useQuestionFilters';
import styles from './FeedFilters.module.css';

export type FeedFiltersProps = {
  filters: QuestionFilters;
  update: ReturnType<typeof useQuestionFilters>['update'];
};

/** Filtres du fil (QA-6) : statut, tri, pays et opérateur (QA-2). */
export function FeedFilters({ filters, update }: FeedFiltersProps) {
  const { t, i18n } = useTranslation();
  const countries = useMemo(() => countryOptions(i18n.language), [i18n.language]);

  return (
    <div className={styles.filters}>
      <Segmented
        label={t('questions.filters.status')}
        value={filters.status}
        onChange={(status) => update({ status })}
        options={[
          { value: 'all', label: t('questions.filters.all') },
          { value: 'open', label: t('questions.filters.open') },
          { value: 'solved', label: t('questions.filters.solved') },
        ]}
      />
      <Segmented
        label={t('questions.filters.sort')}
        value={filters.sort}
        onChange={(sort) => update({ sort })}
        options={[
          ...(filters.q
            ? [{ value: 'relevance' as const, label: t('questions.filters.relevance') }]
            : []),
          { value: 'recent', label: t('questions.filters.recent') },
          { value: 'votes', label: t('questions.filters.votes') },
        ]}
      />
      <div className={styles.selects}>
        <label className="sr-only" htmlFor="filter-country">
          {t('questions.filters.country')}
        </label>
        <select
          id="filter-country"
          className={styles.select}
          value={filters.country ?? ''}
          onChange={(e) => update({ country: e.target.value })}
        >
          <option value="">{t('questions.filters.anyCountry')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-operator">
          {t('questions.filters.operator')}
        </label>
        <select
          id="filter-operator"
          className={styles.select}
          value={filters.operator ?? ''}
          onChange={(e) => update({ operator: e.target.value })}
        >
          <option value="">{t('questions.filters.anyOperator')}</option>
          {OPERATORS.map((op) => (
            <option key={op} value={op}>
              {t(`context.operator.${op}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
