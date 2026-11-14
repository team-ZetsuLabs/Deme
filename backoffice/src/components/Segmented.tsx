import styles from './Segmented.module.css'

export type SegmentedOption<T extends string> = { value: T; label: string; count?: number }

export type SegmentedProps<T extends string> = {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** « tabs » pour des onglets (role=tablist), « filter » pour un filtre (boutons à bascule). */
  kind?: 'filter' | 'tabs'
  /** Onglets soulignés (fiche utilisateur) au lieu du bloc segmenté. */
  underline?: boolean
}

export default function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  kind = 'filter',
  underline = false,
}: SegmentedProps<T>) {
  const tabs = kind === 'tabs'
  return (
    <div
      className={`${styles.seg} ${underline ? styles.underline : ''}`}
      role={tabs ? 'tablist' : 'group'}
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role={tabs ? 'tab' : undefined}
            aria-selected={tabs ? active : undefined}
            aria-pressed={tabs ? undefined : active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && <span className={styles.n}>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
