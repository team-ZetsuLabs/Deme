import { useTranslation } from 'react-i18next';
import type { Level, PublicStats } from '../../api/provisional-types';
import styles from './LevelLadder.module.css';

const STEPS: Level[] = ['NEW', 'MEMBER', 'CONTRIBUTOR', 'REFERENT'];

export type LevelLadderProps = { levels: PublicStats['levels'] };

/** Les quatre niveaux et leurs droits (section 8) : le « par les devs » rendu visible. */
export function LevelLadder({ levels }: LevelLadderProps) {
  const { t, i18n } = useTranslation();
  const threshold = (level: Level) => (level === 'NEW' ? 0 : levels[level]);
  return (
    <ol className={styles.ladder}>
      {STEPS.map((level) => (
        <li
          key={level}
          className={level === 'REFERENT' ? `${styles.step} ${styles.top}` : styles.step}
        >
          <span className={styles.points}>
            {t('home.levels.from', { points: threshold(level).toLocaleString(i18n.language) })}
          </span>
          <b className={styles.name}>{t(`levels.${level}`)}</b>
          <span className={styles.rights}>{t(`home.levels.rights.${level}`)}</span>
        </li>
      ))}
    </ol>
  );
}
