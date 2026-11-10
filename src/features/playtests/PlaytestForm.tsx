import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlaytestDetail } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { playtestsApi } from './playtestsApi';
import styles from '../missions/MissionForm.module.css';

type PlaytestValues = {
  appName: string;
  packageName: string;
  description: string;
  optInUrl: string;
  testersTarget: string;
  desiredStart: string;
  instructions: string;
};

export const TESTERS_MIN = 12;
export const TESTERS_MAX = 100;

const PACKAGE_RE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;
const OPT_IN_RE = /^https:\/\/(play\.google\.com\/apps\/testing\/|groups\.google\.com\/)/;

const VALIDATORS: Validators<PlaytestValues> = {
  appName: (v) =>
    v.trim().length < 2 || v.trim().length > 80 ? 'playtests.new.errors.appName' : null,
  packageName: (v) => (PACKAGE_RE.test(v.trim()) ? null : 'playtests.new.errors.packageName'),
  description: (v) => (v.trim().length < 30 ? 'playtests.new.errors.description' : null),
  optInUrl: (v) => (OPT_IN_RE.test(v.trim()) ? null : 'playtests.new.errors.optInUrl'),
  testersTarget: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= TESTERS_MIN && n <= TESTERS_MAX
      ? null
      : 'playtests.new.errors.testersTarget';
  },
  desiredStart: () => null,
  instructions: () => null,
};

const IDS: Record<keyof PlaytestValues, string> = {
  appName: 'pt-app-name',
  packageName: 'pt-package',
  description: 'pt-description',
  optInUrl: 'pt-opt-in',
  testersTarget: 'pt-testers',
  desiredStart: 'pt-start',
  instructions: 'pt-instructions',
};

export type PlaytestFormProps = {
  /** Campagne à modifier ; absente pour une nouvelle campagne. */
  initial?: PlaytestDetail;
  onSaved: (playtest: PlaytestDetail) => void;
};

/** Créer ou modifier une campagne de test fermé (TST-1). Toujours créée en brouillon. */
export function PlaytestForm({ initial, onSaved }: PlaytestFormProps) {
  const { t } = useTranslation();
  const form = useValidatedForm<PlaytestValues>(
    {
      appName: initial?.appName ?? '',
      packageName: initial?.packageName ?? '',
      description: initial?.descriptionMarkdown ?? '',
      optInUrl: initial?.optInUrl ?? '',
      testersTarget: String(initial?.testersTarget ?? 14),
      desiredStart: initial?.desiredStart ?? '',
      instructions: initial?.instructions ?? '',
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [busy, setBusy] = useState(false);
  const { values, errors } = form;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    submitError.clear();
    const invalid = form.validateAll();
    if (invalid.length) {
      document.getElementById(IDS[invalid[0]])?.focus();
      return;
    }
    setBusy(true);
    try {
      const body = {
        appName: values.appName.trim(),
        packageName: values.packageName.trim(),
        description: values.description.trim(),
        optInUrl: values.optInUrl.trim(),
        testersTarget: Number(values.testersTarget),
        desiredStart: values.desiredStart || undefined,
        instructions: values.instructions.trim() || undefined,
      };
      onSaved(
        initial ? await playtestsApi.update(initial.id, body) : await playtestsApi.create(body),
      );
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const err = (name: keyof PlaytestValues) => fieldErrorText(t, errors[name]);
  const bind = (name: keyof PlaytestValues, hint = false) => ({
    id: IDS[name],
    value: values[name],
    onChange: (e: { target: { value: string } }) => form.setValue(name, e.target.value),
    onBlur: () => form.onBlur(name),
    'aria-invalid': !!err(name),
    'aria-describedby': describedBy(IDS[name], hint, err(name)),
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field id={IDS.appName} label={t('playtests.new.appName')} error={err('appName')}>
        <input
          maxLength={80}
          placeholder={t('playtests.new.appNamePlaceholder')}
          {...bind('appName')}
        />
      </Field>

      <Field
        id={IDS.packageName}
        label={t('playtests.new.packageName')}
        hint={t('playtests.new.packageNameHint')}
        error={err('packageName')}
      >
        <input
          autoCapitalize="none"
          spellCheck={false}
          placeholder="sn.monappli.app"
          {...bind('packageName', true)}
        />
      </Field>

      <Field
        id={IDS.description}
        label={t('playtests.new.description')}
        hint={t('playtests.new.descriptionHint')}
        error={err('description')}
      >
        <textarea rows={6} {...bind('description', true)} />
      </Field>

      <Field
        id={IDS.optInUrl}
        label={t('playtests.new.optInUrl')}
        hint={t('playtests.new.optInUrlHint')}
        error={err('optInUrl')}
      >
        <input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://play.google.com/apps/testing/..."
          {...bind('optInUrl', true)}
        />
      </Field>

      <div className={styles.grid}>
        <Field
          id={IDS.testersTarget}
          label={t('playtests.new.testersTarget')}
          hint={t('playtests.new.testersTargetHint', { min: TESTERS_MIN, max: TESTERS_MAX })}
          error={err('testersTarget')}
        >
          <input
            type="number"
            inputMode="numeric"
            min={TESTERS_MIN}
            max={TESTERS_MAX}
            {...bind('testersTarget', true)}
          />
        </Field>
        <Field
          id={IDS.desiredStart}
          label={t('playtests.new.desiredStart')}
          error={err('desiredStart')}
        >
          <input type="date" {...bind('desiredStart')} />
        </Field>
      </div>

      <Field
        id={IDS.instructions}
        label={t('playtests.new.instructions')}
        hint={t('playtests.new.instructionsHint')}
        error={err('instructions')}
      >
        <textarea rows={3} {...bind('instructions', true)} />
      </Field>

      <p className={styles.notice}>{t('playtests.new.notice')}</p>
      <div className={styles.actions}>
        {initial && (
          <Link to={`/playtests/${initial.id}`} className={buttonClass({ variant: 'secondary' })}>
            {t('settings.cancel')}
          </Link>
        )}
        <Button type="submit" variant="primary" busy={busy}>
          {busy
            ? t('playtests.new.busy')
            : t(initial ? 'playtests.edit.submit' : 'playtests.new.submit')}
        </Button>
      </div>
    </form>
  );
}
