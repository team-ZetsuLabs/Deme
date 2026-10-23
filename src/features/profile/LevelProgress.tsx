import { useTranslation } from 'react-i18next';
import type { Level } from '../../api/types';
import styles from './LevelProgress.module.css';

const NEXT: Record<Level, Level | null> = {
  NEWCOMER: 'MEMBER',
  MEMBER: 'CONTRIBUTOR',
  CONTRIBUTOR: 'REFERENT',
  REFERENT: null,
};

export type LevelProgressProps = {
  level: Level;
  reputation: number;
  /** Seuil du niveau suivant ; absent du contrat pour l'instant, on prend celui du cahier. */
  nextLevelAt?: number | null;
};

/** Seuils de la section 8 du cahier (le serveur peut les abaisser pour la démo). */
const DEFAULT_THRESHOLDS: Record<Level, number | null> = {
  NEWCOMER: 50,
  MEMBER: 500,
  CONTRIBUTOR: 1500,
  REFERENT: null,
};

/** Niveau actuel et progression vers le suivant (section 8 du cahier). */
export function LevelProgress({ level, reputation, nextLevelAt: given }: LevelProgressProps) {
  const { t, i18n } = useTranslation();
  const nextLevelAt = given === undefined ? DEFAULT_THRESHOLDS[level] : given;
  const next = NEXT[level];
  const ratio = nextLevelAt ? Math.min(reputation / nextLevelAt, 1) : 1;
  const missing = nextLevelAt ? Math.max(nextLevelAt - reputation, 0) : 0;

  return (
    <div className={styles.box}>
      <div className={styles.row}>
        <span className={styles.level}>{t(`levels.${level}`)}</span>
        {next && nextLevelAt !== null && (
          <span className={styles.next}>
            {t('profile.nextLevel', {
              points: missing.toLocaleString(i18n.language),
              level: t(`levels.${next}`),
            })}
          </span>
        )}
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={t('profile.progressLabel')}
        aria-valuemin={0}
        aria-valuemax={nextLevelAt ?? reputation}
        aria-valuenow={reputation}
      >
        <i style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}
