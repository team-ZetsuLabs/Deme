import { useTranslation } from 'react-i18next';
import type { PlaytestProgress as Progress } from '../../api/types';
import styles from './PlaytestProgress.module.css';

export type PlaytestProgressProps = { progress: Progress; label?: string };

/**
 * Barre d'avancement d'une campagne : jours effectués rapportés à l'objectif.
 * Ce ne sont que des déclarations de testeurs, jamais une conformité Google Play (TST).
 */
export function PlaytestProgress({ progress, label }: PlaytestProgressProps) {
  const { t } = useTranslation();
  const percent = Math.min(100, Math.max(0, progress.percent));
  return (
    <div>
      <div className={styles.head}>
        <span>{label ?? t('playtests.progress.label')}</span>
        <span className={styles.percent}>{percent}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('playtests.progress.label')}
      >
        <span className={styles.fill} style={{ inlineSize: `${percent}%` }} />
      </div>
    </div>
  );
}
