import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/Avatar';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { StateMessage } from '../../components/StateMessage';
import { useApiQuery } from '../../hooks/useApiQuery';
import { PageLoader } from '../../layout/PageLoader';
import { ContextChips } from '../questions/ContextChips';
import { questionsApi } from '../questions/questionsApi';
import styles from './SolvedPreview.module.css';

const PREVIEW_COUNT = 3;

/** Trois vraies questions résolues : la plateforme montrée par son contenu, pas par un slogan. */
export function SolvedPreview() {
  const { t } = useTranslation();
  const query = useApiQuery(
    () =>
      questionsApi.list({
        status: 'solved',
        sort: 'votes',
        tag: null,
        country: null,
        operator: null,
        q: null,
        page: 0,
      }),
    [],
  );
  const items = query.data?.items.filter((q) => q.solved).slice(0, PREVIEW_COUNT) ?? [];

  return (
    <section className={styles.box} aria-labelledby="home-solved-title">
      <div className={styles.bar}>
        <span className={styles.dot} aria-hidden="true" />
        <h2 id="home-solved-title" className={styles.title}>
          {t('home.solved.title')}
        </h2>
      </div>
      {query.loading && <PageLoader />}
      {!query.loading && query.error !== null && (
        <ErrorState error={query.error} onRetry={query.reload} />
      )}
      {!query.loading && !query.error && items.length === 0 && (
        <StateMessage>{t('home.solved.empty')}</StateMessage>
      )}
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((q) => (
            <li key={q.id} className={styles.item}>
              <Avatar name={q.author.name} photoUrl={q.author.photoUrl} size={32} />
              <div className={styles.body}>
                <h3>
                  <Link to={`/questions/${q.id}`}>{q.title}</Link>
                </h3>
                <ContextChips context={q.context} />
                <p className={styles.meta}>
                  <span className={styles.solved}>
                    <Icon name="check" size={14} />
                    {t('home.solved.answers', { count: q.answerCount })}
                  </span>
                  <span>
                    {q.author.name}
                    {q.author.city && `, ${q.author.city}`}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/questions" className={styles.more}>
        {t('home.solved.more')}
      </Link>
    </section>
  );
}
