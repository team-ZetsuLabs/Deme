import type { CSSProperties, ElementType, ReactNode } from 'react'
import styles from './Panel.module.css'

type BoxProps = { children: ReactNode; className?: string; style?: CSSProperties }

export function Panel({
  as: Tag = 'section',
  children,
  className,
  style,
  ...rest
}: BoxProps & { as?: ElementType } & Record<string, unknown>) {
  return (
    <Tag className={[styles.panel, className].filter(Boolean).join(' ')} style={style} {...rest}>
      {children}
    </Tag>
  )
}

export function PanelHead({
  title,
  description,
  titleId,
  actions,
}: {
  title: string
  description?: string
  titleId?: string
  actions?: ReactNode
}) {
  return (
    <div className={styles.head}>
      <div>
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function PanelBody({ children, className, style }: BoxProps) {
  return (
    <div className={[styles.body, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}

export function SaveBar({ children }: { children: ReactNode }) {
  return <div className={styles.saveBar}>{children}</div>
}

export function PageHead({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <b>{title}</b>
      {children}
    </div>
  )
}

export function Filters({ children }: { children: ReactNode }) {
  return <div className={styles.filters}>{children}</div>
}

export function Grid2({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.grid2, className].filter(Boolean).join(' ')}>{children}</div>
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}
