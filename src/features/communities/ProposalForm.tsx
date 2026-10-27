import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CommunityKind, CommunityProposal } from '../../api/types';
import { CountrySelect } from '../../components/CountrySelect';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { communitiesApi } from './communitiesApi';
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  parseRules,
  validateDescription,
  validateName,
  validateRules,
  validateTag,
} from './validation';
import styles from './ProposalForm.module.css';

type ProposalValues = {
  name: string;
  country: string;
  tag: string;
  description: string;
  rules: string;
};

const IDS: Record<keyof ProposalValues, string> = {
  name: 'proposal-name',
  country: 'proposal-country',
  tag: 'proposal-tag',
  description: 'proposal-description',
  rules: 'proposal-rules',
};

const EMPTY: ProposalValues = { name: '', country: '', tag: '', description: '', rules: '' };

export type ProposalFormProps = { onProposed: (proposal: CommunityProposal) => void };

/** Proposer une communauté (COM-2) : réservé aux Référents, validé ensuite par l'équipe. */
export function ProposalForm({ onProposed }: ProposalFormProps) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<CommunityKind>('TECH');
  const [busy, setBusy] = useState(false);

  // Le pays ou le tag n'est obligatoire que pour le type choisi.
  const validators = useMemo<Validators<ProposalValues>>(
    () => ({
      name: validateName,
      country: (value) =>
        kind === 'COUNTRY' && !value ? 'communities.propose.errors.country' : null,
      tag: (value) => (kind === 'TECH' ? validateTag(value) : null),
      description: validateDescription,
      rules: validateRules,
    }),
    [kind],
  );
  const form = useValidatedForm<ProposalValues>(EMPTY, validators);
  // Le contrat nomme le champ du pays countryCode.
  const submitError = useSubmitError(({ countryCode, ...rest }) =>
    form.setServerErrors({ ...rest, country: countryCode }),
  );
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
      const proposal = await communitiesApi.propose({
        name: values.name.trim(),
        kind,
        countryCode: kind === 'COUNTRY' ? values.country : null,
        tag: kind === 'TECH' ? values.tag.trim() : null,
        description: values.description.trim(),
        rules: parseRules(values.rules),
      });
      form.reset(EMPTY);
      onProposed(proposal);
    } catch (error) {
      submitError.report(error);
    } finally {
      setBusy(false);
    }
  };

  const error = (name: keyof ProposalValues) => fieldErrorText(t, errors[name]);

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('communities.propose.kind')}</legend>
        <div className={styles.radios}>
          {(['TECH', 'COUNTRY'] as CommunityKind[]).map((value) => (
            <label key={value} className={styles.radio}>
              <input
                type="radio"
                name="proposal-kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
              />
              {t(`communities.kinds.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.grid}>
        <Field id={IDS.name} label={t('communities.propose.name')} error={error('name')}>
          <input
            id={IDS.name}
            maxLength={NAME_MAX}
            placeholder={t(
              kind === 'TECH'
                ? 'communities.propose.namePlaceholderTech'
                : 'communities.propose.namePlaceholderCountry',
            )}
            value={values.name}
            onChange={(e) => form.setValue('name', e.target.value)}
            onBlur={() => form.onBlur('name')}
            aria-invalid={!!error('name')}
            aria-describedby={describedBy(IDS.name, false, error('name'))}
          />
        </Field>

        {kind === 'COUNTRY' ? (
          <Field id={IDS.country} label={t('auth.fields.country')} error={error('country')}>
            <CountrySelect
              id={IDS.country}
              value={values.country}
              onChange={(value) => form.setValue('country', value)}
              onBlur={() => form.onBlur('country')}
              emptyLabel={t('auth.fields.countryPlaceholder')}
              invalid={!!error('country')}
              describedBy={describedBy(IDS.country, false, error('country'))}
            />
          </Field>
        ) : (
          <Field
            id={IDS.tag}
            label={t('communities.propose.tag')}
            hint={t('communities.propose.tagHint')}
            error={error('tag')}
          >
            <input
              id={IDS.tag}
              className="mono"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="flutter"
              value={values.tag}
              onChange={(e) => form.setValue('tag', e.target.value.toLowerCase())}
              onBlur={() => form.onBlur('tag')}
              aria-invalid={!!error('tag')}
              aria-describedby={describedBy(IDS.tag, true, error('tag'))}
            />
          </Field>
        )}
      </div>

      <Field
        id={IDS.description}
        label={t('communities.propose.description')}
        hint={t('communities.propose.descriptionHint')}
        error={error('description')}
        labelAside={
          <span className={styles.count} aria-hidden="true">
            {values.description.length}/{DESCRIPTION_MAX}
          </span>
        }
      >
        <textarea
          id={IDS.description}
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={values.description}
          onChange={(e) => form.setValue('description', e.target.value)}
          onBlur={() => form.onBlur('description')}
          aria-invalid={!!error('description')}
          aria-describedby={describedBy(IDS.description, true, error('description'))}
        />
      </Field>

      <Field
        id={IDS.rules}
        label={
          <>
            {t('communities.propose.rules')} <span className="muted">{t('ask.optional')}</span>
          </>
        }
        hint={t('communities.propose.rulesHint')}
        error={error('rules')}
      >
        <textarea
          id={IDS.rules}
          rows={4}
          value={values.rules}
          onChange={(e) => form.setValue('rules', e.target.value)}
          onBlur={() => form.onBlur('rules')}
          aria-invalid={!!error('rules')}
          aria-describedby={describedBy(IDS.rules, true, error('rules'))}
        />
      </Field>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" busy={busy}>
          {busy ? t('communities.propose.busy') : t('communities.propose.submit')}
        </Button>
      </div>
    </form>
  );
}
