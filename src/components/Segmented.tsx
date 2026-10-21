import styles from './Segmented.module.css';

export type SegmentedOption<V extends string> = { value: V; label: string };

export type SegmentedProps<V extends string> = {
  label: string;
  options: SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
};

/** Groupe de boutons exclusifs (filtres, tri). */
export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<V>) {
  return (
    <div className={styles.seg} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
