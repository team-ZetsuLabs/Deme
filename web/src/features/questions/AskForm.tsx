import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
  MobileMoneyOperator,
  NetworkQuality,
  QuestionDetail,
  QuestionImage,
} from '../../api/types';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { OTHER_COUNTRY } from '../../i18n/countries';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { AiAssist } from './AiAssist';
import { QuestionImagePicker } from './QuestionImagePicker';
import { SimilarQuestions } from './SimilarQuestions';
import { NETWORKS, OPERATORS } from './context';
import { questionsApi } from './questionsApi';
import { parseTags, TITLE_MAX, validateBody, validateTags, validateTitle } from './validation';
import styles from './AskForm.module.css';

type AskValues = { title: string; body: string; tags: string };

const VALIDATORS: Validators<AskValues> = {
  title: validateTitle,
  body: validateBody,
  tags: validateTags,
};

const IDS: Record<keyof AskValues, string> = {
  title: 'ask-title',
  body: 'ask-body',
  tags: 'ask-tags',
};

export type AskFormProps = {
  initialTitle?: string;
  /** Étiquettes préremplies (depuis une communauté de techno). */
  initialTags?: string;
  defaultCountry?: string | null;
  /** Question existante : le formulaire passe en modification (QA-3). */
  question?: QuestionDetail;
  onPosted: (question: QuestionDetail) => void;
};

/** Poser une question (QA-1) avec son contexte africain (QA-2), ou modifier la sienne (QA-3). */
export function AskForm({
  initialTitle = '',
  initialTags = '',
  defaultCountry = null,
  question,
  onPosted,
}: AskFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const form = useValidatedForm<AskValues>(
    {
      title: question?.title ?? initialTitle,
      body: question?.bodyMarkdown ?? '',
      tags: question ? question.tags.join(', ') : initialTags,
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [code, setCode] = useState(question?.code ?? '');
  const [country, setCountry] = useState(() => {
    if (question) return question.context?.countryCode ?? '';
    return defaultCountry && defaultCountry !== OTHER_COUNTRY ? defaultCountry : '';
  });
  const [operator, setOperator] = useState<MobileMoneyOperator | ''>(
    question?.context?.mobileMoneyOperator ?? '',
  );
  const [network, setNetwork] = useState<NetworkQuality | ''>(
    question?.context?.networkQuality ?? '',
  );
  const [techVersion, setTechVersion] = useState(question?.context?.techVersion ?? '');
  const [images, setImages] = useState<QuestionImage[]>(question?.images ?? []);
  const { values, errors } = form;
  const context = {
    countryCode: country || null,
    mobileMoneyOperator: operator || null,
    networkQuality: network || null,
    techVersion: techVersion.trim() || null,
  };

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
        title: values.title.trim(),
        body: values.body.trim(),
        code: code.trim() || null,
        tags: parseTags(values.tags),
        context,
        ...(images.length ? { imageIds: images.map((i) => i.id) } : {}),
      };
      onPosted(
        question ? await questionsApi.update(question.id, body) : await questionsApi.create(body),
      );
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const titleError = fieldErrorText(t, errors.title);
  const bodyError = fieldErrorText(t, errors.body);
  const tagsError = fieldErrorText(t, errors.tags);
  const optional = <span className="muted">{t('ask.optional')}</span>;

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field
        id={IDS.title}
        label={t('ask.fields.title')}
        hint={t('ask.fields.titleHint')}
        error={titleError}
        labelAside={
          <span className={styles.count} aria-hidden="true">
            {values.title.length}/{TITLE_MAX}
          </span>
        }
      >
        <input
          id={IDS.title}
          maxLength={TITLE_MAX}
          value={values.title}
          onChange={(e) => form.setValue('title', e.target.value)}
          onBlur={() => form.onBlur('title')}
          aria-invalid={!!titleError}
          aria-describedby={describedBy(IDS.title, true, titleError)}
        />
      </Field>

      {/* En modification, inutile de proposer des questions semblables à la sienne. */}
      {!question && <SimilarQuestions title={values.title} />}

      <Field
        id={IDS.body}
        label={t('ask.fields.body')}
        hint={t('ask.fields.bodyHint')}
        error={bodyError}
      >
        <textarea
          id={IDS.body}
          rows={7}
          placeholder={t('ask.fields.bodyPlaceholder')}
          value={values.body}
          onChange={(e) => form.setValue('body', e.target.value)}
          onBlur={() => form.onBlur('body')}
          aria-invalid={!!bodyError}
          aria-describedby={describedBy(IDS.body, true, bodyError)}
        />
      </Field>

      <Field
        id="ask-code"
        label={
          <>
            {t('ask.fields.code')} {optional}
          </>
        }
      >
        <textarea
          id="ask-code"
          rows={6}
          className="mono"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </Field>

      <QuestionImagePicker images={images} onChange={setImages} />

      <AiAssist
        title={values.title}
        body={values.body}
        code={code}
        tags={values.tags}
        context={context}
        onApplyTitle={(title) => form.setValue('title', title)}
        onApplyTags={(tags) => form.setValue('tags', tags.join(', '))}
        onApplyContext={(detected) => {
          if (detected.countryCode) setCountry(detected.countryCode);
          if (detected.mobileMoneyOperator) setOperator(detected.mobileMoneyOperator);
          if (detected.networkQuality) setNetwork(detected.networkQuality);
          if (detected.techVersion) setTechVersion(detected.techVersion);
        }}
      />

      <Field
        id={IDS.tags}
        label={t('ask.fields.tags')}
        hint={t('ask.fields.tagsHint')}
        error={tagsError}
      >
        <input
          id={IDS.tags}
          autoCapitalize="none"
          spellCheck={false}
          value={values.tags}
          onChange={(e) => form.setValue('tags', e.target.value)}
          onBlur={() => form.onBlur('tags')}
          aria-invalid={!!tagsError}
          aria-describedby={describedBy(IDS.tags, true, tagsError)}
        />
      </Field>

      <fieldset className={styles.context} aria-describedby="ask-context-hint">
        <legend className={styles.legend}>{t('ask.fields.contextLegend')}</legend>
        <p id="ask-context-hint" className={styles.contextHint}>
          {t('ask.fields.contextHint')}
        </p>

        <div className={styles.grid}>
          <Field id="ask-country" label={t('ask.fields.country')}>
            <CountrySelect
              id="ask-country"
              value={country}
              onChange={setCountry}
              emptyLabel={t('ask.fields.noCountry')}
            />
          </Field>
          <Field id="ask-operator" label={t('ask.fields.operator')}>
            <select
              id="ask-operator"
              value={operator}
              onChange={(e) => setOperator(e.target.value as MobileMoneyOperator | '')}
            >
              <option value="">{t('ask.fields.noOperator')}</option>
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {t(`context.operator.${op}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <fieldset className={styles.radios}>
          <legend className={styles.radiosLegend}>{t('ask.fields.network')}</legend>
          {[...NETWORKS, ''].map((value) => (
            <label key={value || 'none'} className={styles.radio}>
              <input
                type="radio"
                name="ask-network"
                value={value}
                checked={network === value}
                onChange={() => setNetwork(value as NetworkQuality | '')}
              />
              {value ? t(`context.network.${value}`) : t('ask.fields.noNetwork')}
            </label>
          ))}
        </fieldset>

        <Field id="ask-version" label={t('ask.fields.techVersion')}>
          <input
            id="ask-version"
            maxLength={60}
            placeholder={t('ask.fields.techVersionPlaceholder')}
            value={techVersion}
            onChange={(e) => setTechVersion(e.target.value)}
          />
        </Field>
      </fieldset>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t('ask.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={busy}>
          {question
            ? busy
              ? t('ask.edit.busy')
              : t('ask.edit.submit')
            : busy
              ? t('ask.busy')
              : t('ask.submit')}
        </Button>
      </div>
    </form>
  );
}
