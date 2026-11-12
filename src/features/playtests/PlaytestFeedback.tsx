import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlaytestDetail, PlaytestFeedbackKind } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Field } from '../../components/Field';
import { RelativeTime } from '../../components/RelativeTime';
import { StateMessage } from '../../components/StateMessage';
import { useToast } from '../../components/useToast';
import { useApiQuery } from '../../hooks/useApiQuery';
import { playtestsApi } from './playtestsApi';
import styles from './PlaytestFeedback.module.css';

const FEEDBACK_MIN = 10;
const FEEDBACK_MAX = 1000;
const KINDS: PlaytestFeedbackKind[] = ['BUG', 'SUGGESTION', 'OTHER'];

export type PlaytestFeedbackProps = {
  playtest: PlaytestDetail;
  isOwner: boolean;
};

/**
 * Retours sur un test fermé (TST) : le porteur lit la liste, un testeur inscrit envoie un
 * retour ou signale un bug. Contrat provisoire (voir message back-end) : marche en mock.
 */
export function PlaytestFeedback({ playtest, isOwner }: PlaytestFeedbackProps) {
  return isOwner ? (
    <OwnerFeedback id={playtest.id} />
  ) : playtest.myParticipation ? (
    <TesterFeedback id={playtest.id} />
  ) : null;
}

/** Liste des retours reçus (porteur). */
function OwnerFeedback({ id }: { id: number }) {
  const { t } = useTranslation();
  const query = useApiQuery(() => playtestsApi.feedback(id), [id]);

  return (
    <section className={styles.box} aria-label={t('playtests.feedback.title')}>
      <h2 className={styles.title}>{t('playtests.feedback.title')}</h2>
      {query.loading && <p className={styles.muted}>{t('common.loading')}</p>}
      {!query.loading && query.error !== null && (
        <ErrorState error={query.error} onRetry={query.reload} />
      )}
      {!query.loading && query.data && query.data.length === 0 && (
        <StateMessage>{t('playtests.feedback.empty')}</StateMessage>
      )}
      {!query.loading && query.data && query.data.length > 0 && (
        <ul className={styles.list}>
          {query.data.map((f) => (
            <li key={f.id} className={styles.item}>
              <div className={styles.head}>
                <Avatar
                  name={f.author.displayName}
                  photoUrl={f.author.avatarUrl ?? null}
                  size={24}
                />
                <Link to={`/users/${f.author.username}`} className={styles.author}>
                  {f.author.displayName}
                </Link>
                <span className={styles.kind}>{t(`playtests.feedback.kind.${f.kind}`)}</span>
                {f.rating != null && (
                  <span className={styles.rating}>
                    {t('playtests.feedback.rating', { n: f.rating })}
                  </span>
                )}
                <span className={styles.time}>
                  <RelativeTime iso={f.createdAt} />
                </span>
              </div>
              <p className={styles.body}>{f.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Formulaire d'envoi d'un retour (testeur inscrit). */
function TesterFeedback({ id }: { id: number }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<PlaytestFeedbackKind>('BUG');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (text.length < FEEDBACK_MIN) {
      setError(t('playtests.feedback.tooShort', { min: FEEDBACK_MIN }));
      return;
    }
    setBusy(true);
    try {
      await playtestsApi.sendFeedback(id, { body: text, kind });
      setBody('');
      setKind('BUG');
      setError(null);
      toast(t('playtests.feedback.sent'));
    } catch (err) {
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.box}>
      <h2 className={styles.title}>{t('playtests.feedback.send.title')}</h2>
      <p className={styles.muted}>{t('playtests.feedback.send.hint')}</p>
      <form onSubmit={onSubmit} noValidate>
        <Field id="pt-feedback-kind" label={t('playtests.feedback.kindLabel')}>
          <select
            id="pt-feedback-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as PlaytestFeedbackKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`playtests.feedback.kind.${k}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pt-feedback-body" label={t('playtests.feedback.field')} error={error}>
          <textarea
            id="pt-feedback-body"
            rows={4}
            maxLength={FEEDBACK_MAX}
            placeholder={t('playtests.feedback.placeholder')}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
          />
        </Field>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" busy={busy}>
            {busy ? t('playtests.feedback.send.busy') : t('playtests.feedback.send.submit')}
          </Button>
        </div>
      </form>
    </section>
  );
}
