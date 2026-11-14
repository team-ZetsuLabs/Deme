import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnswerRequest } from '../../api/types';
import { errorMessage } from '../../api/errorMessage';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useToast } from '../../components/useToast';
import { BODY_MIN } from './validation';
import styles from './AnswerForm.module.css';

export type AnswerFormProps = {
  /** Préfixe des id des champs : plusieurs formulaires peuvent coexister sur la page. */
  idPrefix: string;
  initialBody?: string;
  initialCode?: string | null;
  submitLabel: string;
  /** Envoie la réponse ; une erreur rejetée est affichée dans une notification. */
  onSubmit: (body: AnswerRequest) => Promise<void>;
  /** Vide le formulaire après un envoi réussi (nouvelle réponse). */
  resetOnSuccess?: boolean;
  onCancel?: () => void;
};

/** Répondre ou modifier sa réponse, en Markdown avec un bloc de code facultatif (QA-3). */
export function AnswerForm({
  idPrefix,
  initialBody = '',
  initialCode = null,
  submitLabel,
  onSubmit,
  resetOnSuccess = false,
  onCancel,
}: AnswerFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [body, setBody] = useState(initialBody);
  const [code, setCode] = useState(initialCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bodyId = `${idPrefix}-body`;
  const codeId = `${idPrefix}-code`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (body.trim().length < BODY_MIN) {
      setError(t('question.answerTooShort'));
      document.getElementById(bodyId)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ body: body.trim(), code: code.trim() || null });
      if (resetOnSuccess) {
        setBody('');
        setCode('');
      }
      setError(null);
    } catch (err) {
      toast(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field
        id={bodyId}
        label={t('question.yourAnswer')}
        hint={t('question.answerHint')}
        error={error}
      >
        <textarea
          id={bodyId}
          rows={6}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error && e.target.value.trim().length >= BODY_MIN) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={describedBy(bodyId, true, error)}
        />
      </Field>
      <Field
        id={codeId}
        label={
          <>
            {t('question.answerCode')} <span className="muted">{t('question.optional')}</span>
          </>
        }
      >
        <textarea
          id={codeId}
          rows={4}
          className="mono"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </Field>
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t('question.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" busy={busy}>
          {busy ? t('question.publishing') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
