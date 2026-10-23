import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './Field.module.css'

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
  children: (control: FieldControlProps) => ReactNode
}

export default function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {children({
        id,
        className: styles.control,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
