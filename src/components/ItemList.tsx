import type { ReactNode } from 'react'
import styles from './ItemList.module.css'

export type ItemListProps = { label: string; children: ReactNode }

export default function ItemList({ label, children }: ItemListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {children}
    </ul>
  )
}
