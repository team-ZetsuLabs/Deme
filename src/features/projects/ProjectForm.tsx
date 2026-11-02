import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProjectDetail, ProjectType } from '../../api/types';
import { Button } from '../../components/Button';
import { buttonClass } from '../../components/buttonClass';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { describedBy } from '../../components/fieldIds';
import { fieldErrorText } from '../../hooks/fieldErrorText';
import { useSubmitError } from '../../hooks/useSubmitError';
import { useValidatedForm, type Validators } from '../../hooks/useValidatedForm';
import { parseTags } from '../questions/validation';
import { PROJECT_TYPES, projectsApi } from './projectsApi';
import { validateHttpsUrl, validateProjectDescription, validateProjectTitle } from './validation';
import styles from './ProjectForm.module.css';

type ProjectValues = {
  title: string;
  technologies: string;
  description: string;
  githubUrl: string;
  contactUrl: string;
};

const VALIDATORS: Validators<ProjectValues> = {
  title: validateProjectTitle,
  technologies: (value) => (parseTags(value).length ? null : 'projects.form.errors.technologies'),
  description: validateProjectDescription,
  githubUrl: validateHttpsUrl,
  contactUrl: validateHttpsUrl,
};

const IDS: Record<keyof ProjectValues, string> = {
  title: 'project-title',
  technologies: 'project-technologies',
  description: 'project-description',
  githubUrl: 'project-github',
  contactUrl: 'project-contact',
};

/** Un rôle en cours de saisie (chaînes brutes, converties à l'envoi). */
type RoleDraft = { title: string; technologies: string };

export type ProjectFormProps = {
  /** Projet à modifier ; absent pour une création. */
  initial?: ProjectDetail;
  onSaved: (project: ProjectDetail) => void;
};

/** Création et modification d'un projet (PRJ). */
export function ProjectForm({ initial, onSaved }: ProjectFormProps) {
  const { t } = useTranslation();
  const form = useValidatedForm<ProjectValues>(
    {
      title: initial?.title ?? '',
      technologies: initial?.technologies.join(', ') ?? '',
      description: initial?.descriptionMarkdown ?? '',
      githubUrl: initial?.githubUrl ?? '',
      contactUrl: initial?.contactUrl ?? '',
    },
    VALIDATORS,
  );
  const submitError = useSubmitError(form.setServerErrors);
  const [type, setType] = useState<ProjectType>(initial?.type ?? 'STUDY');
  const [roles, setRoles] = useState<RoleDraft[]>(
    initial?.roles.map((role) => ({
      title: role.title,
      technologies: role.technologies.join(', '),
    })) ?? [],
  );
  const [busy, setBusy] = useState(false);
  const { values, errors } = form;

  const setRole = (index: number, key: keyof RoleDraft, value: string) =>
    setRoles((current) =>
      current.map((role, i) => (i === index ? { ...role, [key]: value } : role)),
    );
  const addRole = () => setRoles((current) => [...current, { title: '', technologies: '' }]);
  const removeRole = (index: number) =>
    setRoles((current) => current.filter((_, i) => i !== index));

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
        descriptionMarkdown: values.description.trim(),
        type,
        technologies: parseTags(values.technologies),
        githubUrl: values.githubUrl.trim() || null,
        contactUrl: values.contactUrl.trim() || null,
        roles: roles
          .filter((role) => role.title.trim())
          .map((role) => ({
            title: role.title.trim(),
            technologies: parseTags(role.technologies),
          })),
      };
      onSaved(
        initial ? await projectsApi.update(initial.id, body) : await projectsApi.create(body),
      );
    } catch (error) {
      submitError.report(error);
      setBusy(false);
    }
  };

  const err = (name: keyof ProjectValues) => fieldErrorText(t, errors[name]);
  const input = (name: keyof ProjectValues, props: { hint?: boolean } = {}) => ({
    id: IDS[name],
    value: values[name],
    onChange: (e: { target: { value: string } }) => form.setValue(name, e.target.value),
    onBlur: () => form.onBlur(name),
    'aria-invalid': !!err(name),
    'aria-describedby': describedBy(IDS[name], !!props.hint, err(name)),
  });
  const optional = <span className="muted">{t('question.optional')}</span>;

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError.message && (
        <div ref={submitError.alertRef} className={styles.alert} role="alert" tabIndex={-1}>
          {submitError.message}
        </div>
      )}

      <Field id={IDS.title} label={t('projects.form.title')} error={err('title')}>
        <input maxLength={120} {...input('title')} />
      </Field>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t('projects.form.type')}</legend>
        <div className={styles.radios}>
          {PROJECT_TYPES.map((value) => (
            <label key={value} className={styles.radio}>
              <input
                type="radio"
                name="project-type"
                checked={type === value}
                onChange={() => setType(value)}
              />
              {t(`projects.types.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id={IDS.technologies}
        label={t('projects.technologies')}
        hint={t('projects.form.technologiesHint')}
        error={err('technologies')}
      >
        <input
          autoCapitalize="none"
          spellCheck={false}
          {...input('technologies', { hint: true })}
        />
      </Field>

      <Field
        id={IDS.description}
        label={t('projects.form.description')}
        hint={t('projects.form.descriptionHint')}
        error={err('description')}
      >
        <textarea rows={8} {...input('description', { hint: true })} />
      </Field>

      <div className={styles.grid}>
        <Field
          id={IDS.githubUrl}
          label={
            <>
              {t('projects.form.github')} {optional}
            </>
          }
          error={err('githubUrl')}
        >
          <input type="url" inputMode="url" placeholder="https://" {...input('githubUrl')} />
        </Field>
        <Field
          id={IDS.contactUrl}
          label={
            <>
              {t('projects.form.contact')} {optional}
            </>
          }
          hint={t('projects.form.contactHint')}
          error={err('contactUrl')}
        >
          <input
            type="url"
            inputMode="url"
            placeholder="https://"
            {...input('contactUrl', { hint: true })}
          />
        </Field>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          {t('projects.form.roles')} {optional}
        </legend>
        <p className={styles.rolesHint}>{t('projects.form.rolesHint')}</p>
        {roles.map((role, index) => (
          <div key={index} className={styles.roleRow}>
            <div className={styles.roleInputs}>
              <label className="sr-only" htmlFor={`project-role-${index}-title`}>
                {t('projects.form.roleTitle')}
              </label>
              <input
                id={`project-role-${index}-title`}
                className={styles.roleTitle}
                maxLength={80}
                placeholder={t('projects.form.roleTitlePlaceholder')}
                value={role.title}
                onChange={(e) => setRole(index, 'title', e.target.value)}
              />
              <label className="sr-only" htmlFor={`project-role-${index}-tech`}>
                {t('projects.form.roleTech')}
              </label>
              <input
                id={`project-role-${index}-tech`}
                className={styles.roleTech}
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('projects.form.roleTechPlaceholder')}
                value={role.technologies}
                onChange={(e) => setRole(index, 'technologies', e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeRole(index)}
              aria-label={t('projects.form.removeRole')}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addRole}>
          {t('projects.form.addRole')}
        </Button>
      </fieldset>

      <div className={styles.actions}>
        {initial && (
          <Link to={`/projects/${initial.id}`} className={buttonClass({ variant: 'secondary' })}>
            {t('settings.cancel')}
          </Link>
        )}
        <Button type="submit" variant="primary" busy={busy}>
          {busy
            ? t('projects.form.busy')
            : t(initial ? 'projects.form.save' : 'projects.form.create')}
        </Button>
      </div>
    </form>
  );
}
