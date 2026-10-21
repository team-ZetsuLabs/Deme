import styles from './StrengthMeter.module.css';

export type StrengthMeterProps = { level: number };

/** Jauge décorative : la règle à respecter est écrite dans l'aide du champ. */
export function StrengthMeter({ level }: StrengthMeterProps) {
  return (
    <div className={styles.meter} data-level={level} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
