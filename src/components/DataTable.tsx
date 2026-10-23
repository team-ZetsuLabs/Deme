import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export function TableWrap({ children, maxHeight }: { children: ReactNode; maxHeight?: number }) {
  return (
    <div className={styles.wrap} style={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}>
      <table className={styles.table}>{children}</table>
    </div>
  )
}

export const cell = {
  num: styles.num,
  right: styles.r,
  hideSm: styles.hideSm,
  muted: styles.muted,
  title: styles.cellTitle,
  rowActions: styles.rowActions,
  mono: styles.mono,
}

export function Who({ avatar, name, sub }: { avatar: ReactNode; name: string; sub?: string }) {
  return (
    <span className={styles.who}>
      {avatar}
      <span className={styles.whoText}>
        <b>{name}</b>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  )
}

export function Pager({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <div className={styles.pager}>
      <span>{summary}</span>
      <div className={styles.pagerBtns}>{children}</div>
    </div>
  )
}

export function BulkBar({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className={styles.bulk} role="region" aria-label={label}>
      {children}
    </div>
  )
}
