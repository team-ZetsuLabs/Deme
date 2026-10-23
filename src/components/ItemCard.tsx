import type { ReactNode } from 'react'
import styles from './ItemCard.module.css'

export type ItemCardProps = {
  leading?: ReactNode
  title: string
  meta?: string
  badges?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}

export default function ItemCard({
  leading,
  title,
  meta,
  badges,
  children,
  actions,
}: ItemCardProps) {
  return (
    <li className={styles.card}>
      <div className={styles.head}>
        {leading}
        <div className={styles.titles}>
          <h2 className={styles.title}>{title}</h2>
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
        {badges && <div className={styles.badges}>{badges}</div>}
      </div>
      {children && <div className={styles.body}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </li>
  )
}
