import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlaytestDetail, PlaytestPlatform, PlaytestRequest } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { PLATFORMS, PLATFORM_CONFIG, validatePackageId } from './platforms';
import { playtestsApi } from './playtestsApi';
import styles from '../missions/MissionForm.module.css';

type PlaytestValues = {
  platform: string;
  appName: string;
  packageName: string;
  description: string;
  optInUrl: string;
  testersTarget: string;
  desiredStart: string;
  desiredEnd: string;
  instructions: string;
};

const asPlatform = (v: string): PlaytestPlatform => v as PlaytestPlatform;

/** Dates au format AAAA-MM-JJ, calculs en UTC pour éviter les décalages de fuseau. */
const todayIso = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);

const VALIDATORS: Validators<PlaytestValues> = {
  platform: () => null,
  appName: (v) =>
    v.trim().length < 2 || v.trim().length > 80 ? 'playtests.new.errors.appName' : null,
  packageName: (v, vals) => {
    const kind = PLATFORM_CONFIG[asPlatform(vals.platform)].packageKind;
    if (!kind) return null;
    return validatePackageId(asPlatform(vals.platform), v)
      ? null
      : `playtests.new.errors.packageName.${kind}`;
  },
  description: (v) => (v.trim().length < 30 ? 'playtests.new.errors.description' : null),
  optInUrl: (v, vals) =>
    PLATFORM_CONFIG[asPlatform(vals.platform)].optInRe.test(v.trim())
      ? null
      : `playtests.new.errors.optInUrl.${vals.platform}`,
  testersTarget: (v, vals) => {
    const c = PLATFORM_CONFIG[asPlatform(vals.platform)];
    const n = Number(v);
    return Number.isInteger(n) && n >= c.testersMin && n <= c.testersMax
      ? null
      : 'playtests.new.errors.testersTarget';
  },
  desiredStart: (v) => (v ? null : 'playtests.new.errors.desiredStart'),
  // La durée est l'écart début → fin, bornée par la plateforme (ex. 14 j mini sur Google Play).
  desiredEnd: (v, vals) => {
    if (!v || !vals.desiredStart) return 'playtests.new.errors.desiredEnd';
    const c = PLATFORM_CONFIG[asPlatform(vals.platform)];
    const d = daysBetween(vals.desiredStart, v);
    return d >= c.daysMin && d <= c.daysMax ? null : 'playtests.new.errors.desiredEnd';
  },
  instructions: () => null,
};

const IDS: Record<keyof PlaytestValues, string> = {
  platform: 'pt-platform',
  appName: 'pt-app-name',
  packageName: 'pt-package',
  description: 'pt-description',
  optInUrl: 'pt-opt-in',
  testersTarget: 'pt-testers',
  desiredStart: 'pt-start',
  desiredEnd: 'pt-end',
  instructions: 'pt-instructions',
};

export type PlaytestFormProps = {
  /** Campagne à modifier ; absente pour une nouvelle campagne. */
  initial?: PlaytestDetail;
  onSaved: (playtest: PlaytestDetail) => void;
};

/** Créer ou modifier une campagne de test fermé (TST-1, TST-7). */
export function PlaytestForm({ initial, onSaved }: PlaytestFormProps) {
  const { t } = useTranslation();
  const initialPlatform: PlaytestPlatform = initial?.platform ?? 'GOOGLE_PLAY';
  // Pré-remplissage : début = date enregistrée ou aujourd'hui ; fin = début + durée enregistrée
  // (reconstituée depuis requiredDays) ou durée par défaut de la plateforme.
  const initialStart = initial?.desiredStart ?? todayIso();
  const initialDays = initial?.requiredDays ?? PLATFORM_CONFIG[initialPlatform].daysDefault;
  const form = useValidatedForm<PlaytestValues>(
    {
      platform: initialPlatform,
      appName: initial?.appName ?? '',
      packageName: initial?.packageName ?? '',
      description: initial?.descriptionMarkdown ?? '',
      optInUrl: initial?.optInUrl ?? '',
      testersTarget: String(
        initial?.testersTarget ?? PLATFORM_CONFIG[initialPlatform].testersDefault,
      ),
      desiredStart: initialStart,
      desiredEnd: addDays(initialStart, initialDays),
      instructions: initial?.instructions ?? '',
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [busy, setBusy] = useState(false);
  // Quel bouton a été cliqué : publier (défaut) ou garder en brouillon. Lu dans onSubmit.
  const publishRef = useRef(true);
  const { values, errors } = form;
  const platform = asPlatform(values.platform);
  const config = PLATFORM_CONFIG[platform];

  // Un seul setValue : enchaîner plusieurs setValue lirait des valeurs périmées.
  const onPlatform = (next: PlaytestPlatform) => form.setValue('platform', next);

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
      // La durée (requiredDays) est l'écart début → fin, envoyée pour toutes les plateformes.
      // packageName reste ignoré en web (pas d'identifiant d'application).
      const body: PlaytestRequest = {
        platform,
        appName: values.appName.trim(),
        description: values.description.trim(),
        optInUrl: values.optInUrl.trim(),
        testersTarget: Number(values.testersTarget),
        requiredDays: daysBetween(values.desiredStart, values.desiredEnd),
        desiredStart: values.desiredStart,
        ...(config.packageKind ? { packageName: values.packageName.trim() } : {}),
        ...(values.instructions.trim() ? { instructions: values.instructions.trim() } : {}),
      };
      let saved = initial
        ? await playtestsApi.update(initial.id, body)
        : await playtestsApi.create(body);
      // Publier directement : le back crée un brouillon, submit le met ACTIVE ou en validation.
      if (!initial && publishRef.current) saved = await playtestsApi.submit(saved.id);
      onSaved(saved);
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const durationDays =
    values.desiredStart && values.desiredEnd
      ? daysBetween(values.desiredStart, values.desiredEnd)
      : null;

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

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('playtests.new.platform')}</legend>
        <div className={styles.kinds}>
          {PLATFORMS.map((value) => (
            <label key={value} className={styles.kind}>
              <input
                type="radio"
                name="pt-platform"
                checked={platform === value}
                onChange={() => onPlatform(value)}
              />
              <span>
                <b>{t(`playtests.platform.${value}`)}</b>
                <small>{t(`playtests.platformHint.${value}`)}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field id={IDS.appName} label={t('playtests.new.appName')} error={err('appName')}>
        <input
          maxLength={80}
          placeholder={t('playtests.new.appNamePlaceholder')}
          {...bind('appName')}
        />
      </Field>

      {config.packageKind && (
        <Field
          id={IDS.packageName}
          label={t('playtests.new.packageName')}
          hint={t(`playtests.new.packageNameHint.${config.packageKind}`)}
          error={err('packageName')}
        >
          <input
            autoCapitalize="none"
            spellCheck={false}
            placeholder={config.packageKind === 'bundle' ? 'com.monappli.ios' : 'sn.monappli.app'}
            {...bind('packageName', true)}
          />
        </Field>
      )}

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
        hint={t(`playtests.new.optInUrlHint.${platform}`)}
        error={err('optInUrl')}
      >
        <input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://"
          {...bind('optInUrl', true)}
        />
      </Field>

      <Field
        id={IDS.testersTarget}
        label={t('playtests.new.testersTarget')}
        hint={t('playtests.new.testersTargetHint', {
          min: config.testersMin,
          max: config.testersMax,
        })}
        error={err('testersTarget')}
      >
        <input
          type="number"
          inputMode="numeric"
          min={config.testersMin}
          max={config.testersMax}
          {...bind('testersTarget', true)}
        />
      </Field>

      <div className={styles.grid}>
        <Field
          id={IDS.desiredStart}
          label={t('playtests.new.desiredStart')}
          error={err('desiredStart')}
        >
          <input type="date" min={todayIso()} {...bind('desiredStart')} />
        </Field>
        <Field
          id={IDS.desiredEnd}
          label={t('playtests.new.desiredEnd')}
          hint={t('playtests.new.desiredEndHint', { min: config.daysMin, max: config.daysMax })}
          error={err('desiredEnd')}
        >
          <input
            type="date"
            min={values.desiredStart || todayIso()}
            {...bind('desiredEnd', true)}
          />
        </Field>
      </div>
      {durationDays !== null && durationDays > 0 && (
        <p className={styles.notice}>{t('playtests.new.durationDays', { count: durationDays })}</p>
      )}

      <Field
        id={IDS.instructions}
        label={t('playtests.new.instructions')}
        hint={t('playtests.new.instructionsHint')}
        error={err('instructions')}
      >
        <textarea rows={3} {...bind('instructions', true)} />
      </Field>

      <p className={styles.notice}>
        {config.tracking === 'NONE' ? t('playtests.new.noticeWeb') : t('playtests.new.notice')}
      </p>
      <div className={styles.actions}>
        {initial ? (
          <>
            <Link to={`/playtests/${initial.id}`} className={buttonClass({ variant: 'secondary' })}>
              {t('settings.cancel')}
            </Link>
            <Button type="submit" variant="primary" busy={busy}>
              {busy ? t('playtests.new.busy') : t('playtests.edit.submit')}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              variant="secondary"
              busy={busy}
              onClick={() => {
                publishRef.current = false;
              }}
            >
              {t('playtests.new.saveDraft')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              busy={busy}
              onClick={() => {
                publishRef.current = true;
              }}
            >
              {busy ? t('playtests.new.busy') : t('playtests.new.publish')}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
