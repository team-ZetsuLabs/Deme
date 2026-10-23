import type { ReactNode } from 'react'
import styles from './Status.module.css'

export type Tone = 'neutral' | 'good' | 'warn' | 'serious' | 'crit'

export function Status({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`${styles.status} ${styles[tone]}`}>{children}</span>
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className={styles.pill}>{children}</span>
}

export function Tag({ children, soft }: { children: ReactNode; soft?: boolean }) {
  return <span className={`${styles.tag} ${soft ? styles.soft : ''}`}>{children}</span>
}

export function Tags({ children }: { children: ReactNode }) {
  return <div className={styles.tags}>{children}</div>
}
