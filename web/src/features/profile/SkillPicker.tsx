import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { Tag } from '../../components/Tag';
import { normalizeSkill, SKILLS_MAX, SUGGESTED_SKILLS } from './skills';
import styles from './SkillPicker.module.css';

export type SkillPickerProps = {
  value: string[];
  onChange: (skills: string[]) => void;
};

/** Choix des technologies : suggestions d'un clic, plus saisie libre. */
export function SkillPicker({ value, onChange }: SkillPickerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const full = value.length >= SKILLS_MAX;
  const choices = [...new Set([...SUGGESTED_SKILLS, ...value])];

  const toggle = (skill: string) => {
    if (value.includes(skill)) onChange(value.filter((s) => s !== skill));
    else if (!full) onChange([...value, skill]);
    else setError(t('welcome.stack.max'));
  };

  const add = () => {
    const skill = normalizeSkill(draft);
    if (!skill) {
      setError(t('welcome.stack.invalid'));
      return;
    }
    if (full && !value.includes(skill)) {
      setError(t('welcome.stack.max'));
      return;
    }
    if (!value.includes(skill)) onChange([...value, skill]);
    setDraft('');
    setError(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (draft.trim()) add();
    }
  };

  return (
    <div>
      <div className={styles.choices}>
        {choices.map((skill) => (
          <Tag key={skill} pressed={value.includes(skill)} onClick={() => toggle(skill)}>
            {skill}
          </Tag>
        ))}
      </div>
      <p className={styles.count} aria-live="polite">
        {t('welcome.stack.selected', { count: value.length })}
      </p>
      <label htmlFor="skill-add" className={styles.label}>
        {t('welcome.stack.addLabel')}
      </label>
      <div className={styles.addRow}>
        <input
          id="skill-add"
          className={styles.input}
          value={draft}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={35}
          placeholder={t('welcome.stack.addPlaceholder')}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={onKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? 'skill-add-error' : undefined}
        />
        <Button onClick={add} disabled={!draft.trim()}>
          {t('welcome.stack.add')}
        </Button>
      </div>
      {error && (
        <p id="skill-add-error" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
