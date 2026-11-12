import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { remainingUntil } from './remaining';
import styles from './Countdown.module.css';

/** Mise à jour chaque seconde : le compte à rebours affiche les secondes qui défilent. */
const TICK_MS = 1_000;

export type CountdownProps = { endsAt: string };

export function Countdown({ endsAt }: CountdownProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const r = remainingUntil(endsAt, now);
  if (r.ended) return <p className={styles.ended}>{t('challenges.ended')}</p>;

  const parts = [
    { value: String(r.days), label: t('challenges.units.days', { count: r.days }) },
    {
      value: String(r.hours).padStart(2, '0'),
      label: t('challenges.units.hours', { count: r.hours }),
    },
    {
      value: String(r.minutes).padStart(2, '0'),
      label: t('challenges.units.minutes', { count: r.minutes }),
    },
    {
      value: String(r.seconds).padStart(2, '0'),
      label: t('challenges.units.seconds', { count: r.seconds }),
    },
  ];

  return (
    <div>
      <p className={styles.caption}>{t('challenges.closesIn')}</p>
      {/* Lu une fois en phrase entière ; les chiffres ne sont pas annoncés à chaque mise à jour.
          Les secondes restent visuelles seulement : les inclure ici ferait changer la phrase
          chaque seconde. Chaque unité est accordée à part (« 1 jour », « 2 jours ») : une phrase
          avec plusieurs nombres ne peut pas s'accorder avec un seul `count`. */}
      <p className="sr-only">
        {t('challenges.closesInFull', {
          days: t('challenges.unitsFull.days', { count: r.days }),
          hours: t('challenges.unitsFull.hours', { count: r.hours }),
          minutes: t('challenges.unitsFull.minutes', { count: r.minutes }),
        })}
      </p>
      <div className={styles.clock} aria-hidden="true">
        {parts.map((p) => (
          <div key={p.label} className={styles.cell}>
            <strong>{p.value}</strong>
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
