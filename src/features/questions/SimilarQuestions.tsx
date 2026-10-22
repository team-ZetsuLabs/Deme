import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/skeleton/Skeleton';
import { useSimilarQuestions } from './useSimilarQuestions';
import styles from './SimilarQuestions.module.css';

export type SimilarQuestionsProps = { title: string };

/**
 * Questions qui ressemblent au titre en cours de saisie (QA-8), pour éviter les doublons.
 * Les liens s'ouvrent dans un nouvel onglet : le brouillon n'est pas perdu.
 */
export function SimilarQuestions({ title }: SimilarQuestionsProps) {
  const { t } = useTranslation();
  const state = useSimilarQuestions(title);

  if (state.status === 'idle') return null;

  return (
    <section className={styles.similar} aria-labelledby="similar-title" aria-live="polite">
      <h2 id="similar-title" className={styles.title}>
        {t('ask.similar.title')}
      </h2>

      {state.status === 'loading' && (
        <div className={styles.loading} aria-busy="true">
          <span className="sr-only">{t('ask.similar.loading')}</span>
          <Skeleton width="85%" height={13} />
          <Skeleton width="65%" height={13} />
          <Skeleton width="75%" height={13} />
        </div>
      )}

      {state.status === 'error' && <p className={styles.text}>{t('ask.similar.error')}</p>}

      {state.status === 'done' && state.items.length === 0 && (
        <p className={styles.text}>{t('ask.similar.empty')}</p>
      )}

      {state.status === 'done' && state.items.length > 0 && (
        <>
          <p className={styles.text}>{t('ask.similar.lead')}</p>
          <ul className={styles.list}>
            {state.items.map((q) => (
              <li key={q.id}>
                <Link
                  to={`/questions/${q.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {q.title}
                  <span className="sr-only"> {t('ask.similar.newTab')}</span>
                </Link>
                <span className={q.solved ? `${styles.meta} ${styles.solved}` : styles.meta}>
                  {q.solved && <Icon name="check" size={12} />}
                  {q.solved
                    ? t('questions.row.solved')
                    : t('question.answers', { count: q.answerCount })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
