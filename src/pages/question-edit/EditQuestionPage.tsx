import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/api';
import { buttonClass } from '../../components/buttonClass';
import { ErrorState } from '../../components/ErrorState';
import { StateMessage } from '../../components/StateMessage';
import { QuestionDetailSkeleton } from '../../components/skeleton/QuestionDetailSkeleton';
import { useToast } from '../../components/useToast';
import { AskForm } from '../../features/questions/AskForm';
import { questionsApi } from '../../features/questions/questionsApi';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from '../ask/AskPage.module.css';

export default function EditQuestionPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <EditQuestion id={id} /> : <NotFoundPage />;
}

/** Modifier sa question (QA-3). Réservée à son auteur : le serveur renvoie `canEdit`. */
function EditQuestion({ id }: { id: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const query = useApiQuery(() => questionsApi.get(id), [id]);
  usePageTitle(t('ask.edit.pageTitle'));

  if (query.loading) return <QuestionDetailSkeleton />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  const question = query.data;
  if (query.error || !question) return <ErrorState error={query.error} onRetry={query.reload} />;

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('ask.edit.pageTitle')}</h1>
      {question.canEdit ? (
        <>
          <p className={styles.lead}>{t('ask.edit.lead')}</p>
          <AskForm
            question={question}
            onPosted={(saved) => {
              toast(t('ask.edit.saved'));
              navigate(`/questions/${saved.id}`, { replace: true });
            }}
          />
        </>
      ) : (
        <StateMessage
          action={
            <Link
              to={`/questions/${question.id}`}
              className={buttonClass({ variant: 'secondary' })}
            >
              {t('ask.edit.back')}
            </Link>
          }
        >
          {t('ask.edit.notAllowed')}
        </StateMessage>
      )}
    </section>
  );
}
