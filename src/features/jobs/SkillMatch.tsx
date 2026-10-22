import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import styles from './SkillMatch.module.css';

export type SkillMatchProps = {
  required: string[];
  mine: string[];
};

/** Correspondance entre la stack du membre et les technologies demandées (JOB-2). */
export function SkillMatch({ required, mine }: SkillMatchProps) {
  const { t } = useTranslation();
  const owned = new Set(mine.map((s) => s.toLowerCase()));
  const matches = required.filter((tech) => owned.has(tech.toLowerCase()));

  return (
    <div>
      <p className={styles.summary}>
        {t('jobs.match.summary', { count: matches.length, total: required.length })}
      </p>
      <ul className={styles.list}>
        {required.map((tech) => {
          const ok = owned.has(tech.toLowerCase());
          return (
            <li key={tech} className={ok ? styles.ok : styles.no}>
              <Icon name={ok ? 'check' : 'x'} size={14} />
              <span className={styles.tech}>{tech}</span>
              <span className="sr-only">{ok ? t('jobs.match.have') : t('jobs.match.missing')}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
