import { useTranslation } from 'react-i18next';
import type { PublicStats } from '../../api/provisional-types';
import styles from './StatsStrip.module.css';

export type StatsStripProps = { stats: PublicStats };

/** Chiffres réels de la plateforme, calculés par le serveur (cahier, point 2 de la revue). */
export function StatsStrip({ stats }: StatsStripProps) {
  const { t, i18n } = useTranslation();
  const n = (value: number) => value.toLocaleString(i18n.language);
  const percent = new Intl.NumberFormat(i18n.language, { style: 'percent' }).format(
    stats.solvedRate,
  );
  const items = [
    { value: n(stats.questions), label: t('home.stats.questions') },
    { value: percent, label: t('home.stats.solved') },
    { value: n(stats.members), label: t('home.stats.members') },
    { value: n(stats.countries), label: t('home.stats.countries') },
  ];
  return (
    <dl className={styles.strip}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
