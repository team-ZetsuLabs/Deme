import { useTranslation } from 'react-i18next';
import type { MissionSummary } from '../../api/types';
import { Icon } from '../../components/Icon';
import { formatMoney } from './money';
import styles from './MissionFacts.module.css';

export type MissionFactsProps = { mission: MissionSummary };

/** Type de mission, budget indicatif et délai. */
export function MissionFacts({ mission }: MissionFactsProps) {
  const { t, i18n } = useTranslation();
  return (
    <ul className={styles.facts}>
      <li className={styles.kind}>{t(`missions.kind.${mission.kind}`)}</li>
      <li className={styles.fact}>
        {t('missions.budget', { amount: formatMoney(mission.budget, i18n.language) })}
      </li>
      <li className={styles.fact}>
        <Icon name="clock" size={13} />
        {t('missions.delay', { count: mission.durationDays })}
      </li>
    </ul>
  );
}
