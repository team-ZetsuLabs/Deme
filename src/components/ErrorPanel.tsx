import type { ReactNode } from 'react'
import styles from './ErrorPanel.module.css'

export type ErrorPanelProps = {
  title: string
  message: string
  actions?: ReactNode
}

export default function ErrorPanel({ title, message, actions }: ErrorPanelProps) {
  return (
    <section className={styles.panel} role="alert">
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  )
}
