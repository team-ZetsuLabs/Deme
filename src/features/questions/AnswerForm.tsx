import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Answer } from '../../api/provisional-types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useToast } from '../../components/useToast';
import { questionsApi } from './questionsApi';
import { BODY_MIN } from './validation';

export type AnswerFormProps = {
  questionId: number;
  onPosted: (answer: Answer) => void;
};

/** Répondre en Markdown, avec un bloc de code facultatif (QA-3). */
export function AnswerForm({ questionId, onPosted }: AnswerFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tooShort = body.trim().length < BODY_MIN;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (tooShort) {
      setError(t('question.answerTooShort'));
      document.getElementById('answer-body')?.focus();
      return;
    }
    setBusy(true);
    try {
      const answer = await questionsApi.answer(questionId, {
        body: body.trim(),
        code: code.trim() || null,
      });
      setBody('');
      setCode('');
      setError(null);
      onPosted(answer);
    } catch (err) {
      toast(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field
        id="answer-body"
        label={t('question.yourAnswer')}
        hint={t('question.answerHint')}
        error={error}
      >
        <textarea
          id="answer-body"
          rows={6}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error && e.target.value.trim().length >= BODY_MIN) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={describedBy('answer-body', true, error)}
        />
      </Field>
      <Field
        id="answer-code"
        label={
          <>
            {t('question.answerCode')} <span className="muted">{t('question.optional')}</span>
          </>
        }
      >
        <textarea
          id="answer-code"
          rows={4}
          className="mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" busy={busy}>
        {busy ? t('question.publishing') : t('question.publish')}
      </Button>
    </form>
  );
}
