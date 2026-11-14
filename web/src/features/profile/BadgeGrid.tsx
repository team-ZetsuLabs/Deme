import { useTranslation } from 'react-i18next';
import { BADGES } from './badges';
import styles from './BadgeGrid.module.css';

export type BadgeGridProps = { earned: string[] };

/** Tous les badges, ceux obtenus en couleur, les autres en pointillés. */
export function BadgeGrid({ earned }: BadgeGridProps) {
  const { t } = useTranslation();
  return (
    <ul className={styles.grid}>
      {BADGES.map((badge) => {
        const has = earned.includes(badge.id);
        return (
          <li key={badge.id} className={has ? styles.item : `${styles.item} ${styles.locked}`}>
            <span
              className={`${styles.medal} ${styles[has ? badge.tone : 'grey']}`}
              aria-hidden="true"
            >
              {badge.short}
            </span>
            <div>
              <b>{t(`badges.${badge.id}.name`)}</b>
              <span className={styles.desc}>
                {t(`badges.${badge.id}.desc`)}
                {!has && ` ${t('profile.badgeLocked')}`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
