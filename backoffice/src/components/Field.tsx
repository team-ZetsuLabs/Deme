import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './Field.module.css'

export const inputClass = styles.control
export const selectClass = `${styles.control} ${styles.select}`
export const compactSelectClass = styles.compactSelect

export type FieldControlProps = {
  id: string
  className: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

export type FieldProps = {
  label: string
  hint?: string
  error?: string
  /** Sélecteur : applique la flèche et la hauteur des champs de la maquette. */
  select?: boolean
  style?: CSSProperties
  children: (control: FieldControlProps) => ReactNode
}

export default function Field({ label, hint, error, select, style, children }: FieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={styles.field} style={style}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({
        id,
        className: select ? selectClass : inputClass,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export type ToggleProps = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <span className={styles.toggle}>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i />
    </span>
  )
}

export type SwitchRowProps = { title: string; description?: string; children: ReactNode }

export function SwitchRow({ title, description, children }: SwitchRowProps) {
  return (
    <div className={styles.switchRow}>
      <span className={styles.switchText}>
        <b>{title}</b>
        {description && <span>{description}</span>}
      </span>
      {children}
    </div>
  )
}
