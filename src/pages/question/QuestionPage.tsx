import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Answer } from '../../api/provisional-types';
import { ApiError } from '../../api/api';
import { errorMessage } from '../../api/errorMessage';
import { buttonClass } from '../../components/buttonClass';
import { CodeBlock } from '../../components/CodeBlock';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { MemberContent } from '../../components/MemberContent';
import { RelativeTime } from '../../components/RelativeTime';
import { Segmented } from '../../components/Segmented';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { AnswerForm } from '../../features/questions/AnswerForm';
import { AnswerItem } from '../../features/questions/AnswerItem';
import { AuthorCard } from '../../features/questions/AuthorCard';
import { ContextChips } from '../../features/questions/ContextChips';
import { questionsApi } from '../../features/questions/questionsApi';
import { VoteControl } from '../../features/questions/VoteControl';
import { ReportButton } from '../../features/moderation/ReportButton';
import detail from '../../features/questions/QuestionDetail.module.css';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageLoader } from '../../layout/PageLoader';
import NotFoundPage from '../notfound/NotFoundPage';
import styles from './QuestionPage.module.css';

type AnswerSort = 'votes' | 'recent';

/** Réponse acceptée en tête, puis tri choisi (QA-5). */
function sortAnswers(answers: Answer[], sort: AnswerSort): Answer[] {
  return [...answers].sort(
    (a, b) =>
      Number(b.accepted) - Number(a.accepted) ||
      (sort === 'votes'
        ? b.votes - a.votes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );
}

export default function QuestionPage() {
  const { id: rawId } = useParams();
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? <QuestionView id={id} /> : <NotFoundPage />;
}

function QuestionView({ id }: { id: number }) {
  const { t } = useTranslation();
  const { user } = useSession();
  const toast = useToast();
  const location = useLocation();
  const [sort, setSort] = useState<AnswerSort>('votes');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const query = useApiQuery(() => questionsApi.get(id), [id]);
  const q = query.data;
  usePageTitle(q?.title ?? t('question.crumbQuestion'));

  const answers = useMemo(() => (q ? sortAnswers(q.answers, sort) : []), [q, sort]);

  if (query.loading) return <PageLoader />;
  if (query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage />;
  if (query.error || !q) return <ErrorState error={query.error} onRetry={query.reload} />;

  const isAuthor = user?.id === q.author.id;

  const updateAnswer = (answerId: number, change: Partial<Answer>) =>
    query.setData((current) => ({
      ...current,
      answers: current.answers.map((a) => (a.id === answerId ? { ...a, ...change } : a)),
    }));

  const onAccept = async (answer: Answer) => {
    setAcceptingId(answer.id);
    try {
      await questionsApi.accept(q.id, answer.id);
      query.setData((current) => ({
        ...current,
        answers: current.answers.map((a) => ({ ...a, accepted: a.id === answer.id })),
      }));
      toast(t('question.accepted'));
    } catch (error) {
      toast(errorMessage(t, error));
    } finally {
      setAcceptingId(null);
    }
  };

  const onPosted = (answer: Answer) => {
    query.setData((current) => ({ ...current, answers: [...current.answers, answer] }));
    setSort('recent');
    toast(t('question.posted'));
    requestAnimationFrame(() =>
      document.getElementById(`answer-${answer.id}`)?.scrollIntoView({ block: 'center' }),
    );
  };

  return (
    <>
      <nav className={styles.crumbs} aria-label={t('question.crumbs')}>
        <Link to="/questions">{t('nav.questions')}</Link>
        <span aria-hidden="true">/</span>
        {q.tags[0] && (
          <>
            <Link to={`/questions?tag=${encodeURIComponent(q.tags[0])}`}>{q.tags[0]}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{t('question.crumbQuestion')}</span>
      </nav>

      <article className={styles.panel}>
        <div className={styles.head}>
          <h1 className={styles.title}>{q.title}</h1>
          <Link to="/questions/ask" className={buttonClass({ variant: 'primary' })}>
            {t('question.askQuestion')}
          </Link>
        </div>
        <div className={styles.meta}>
          <span>
            <Icon name="cal" size={14} /> {t('question.asked')} <RelativeTime iso={q.createdAt} />
          </span>
          <span>{t('question.views', { count: q.views })}</span>
          <span>{t('question.answers', { count: q.answers.length })}</span>
        </div>
        <div className={styles.context}>
          <ContextChips context={q.context} />
        </div>

        <div className={detail.post}>
          <div className={detail.side}>
            <VoteControl
              target="question"
              id={q.id}
              authorId={q.author.id}
              votes={q.votes}
              voted={q.voted}
              onChange={(votes, voted) => query.setData((c) => ({ ...c, votes, voted }))}
            />
          </div>
          <div className={detail.content}>
            <MemberContent html={q.bodyHtml} />
            {q.code && <CodeBlock code={q.code} />}
            <div className={detail.foot}>
              <div className={detail.actions}>
                <ul className={styles.tags}>
                  {q.tags.map((tag) => (
                    <li key={tag}>
                      <Link className={styles.tag} to={`/questions?tag=${encodeURIComponent(tag)}`}>
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ReportButton targetType="QUESTION" targetId={q.id} authorId={q.author.id} />
              </div>
              <AuthorCard author={q.author} label={t('question.askedBy')} />
            </div>
          </div>
        </div>
      </article>

      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>
          {t('question.answers', { count: q.answers.length })}
        </h2>
        {q.answers.length > 1 && (
          <Segmented<AnswerSort>
            label={t('question.sort')}
            value={sort}
            onChange={setSort}
            options={[
              { value: 'votes', label: t('question.sortVotes') },
              { value: 'recent', label: t('question.sortRecent') },
            ]}
          />
        )}
      </div>

      <section
        className={styles.panel}
        aria-label={t('question.answers', { count: q.answers.length })}
      >
        {answers.length === 0 ? (
          <StateMessage>{t('question.noAnswers')}</StateMessage>
        ) : (
          answers.map((a) => (
            <AnswerItem
              key={a.id}
              answer={a}
              canAccept={isAuthor}
              isOwn={user?.id === a.author.id}
              sameCountry={!!q.context.country && a.author.country === q.context.country}
              accepting={acceptingId === a.id}
              onAccept={() => onAccept(a)}
              onVote={(votes, voted) => updateAnswer(a.id, { votes, voted })}
              onEdited={(updated) => updateAnswer(a.id, updated)}
              extraActions={
                <ReportButton targetType="ANSWER" targetId={a.id} authorId={a.author.id} />
              }
            />
          ))
        )}
      </section>

      <section className={`${styles.panel} ${styles.answerBox}`}>
        {user ? (
          <AnswerForm
            idPrefix="answer"
            submitLabel={t('question.publish')}
            resetOnSuccess
            onSubmit={async (body) => onPosted(await questionsApi.answer(q.id, body))}
          />
        ) : (
          <>
            <h2 className={styles.sectionTitle}>{t('question.yourAnswer')}</h2>
            <p className={styles.loginText}>{t('question.loginToAnswerText')}</p>
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className={buttonClass({ variant: 'primary' })}
            >
              {t('question.loginToAnswer')}
            </Link>
          </>
        )}
      </section>
    </>
  );
}
