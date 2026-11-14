import type { CSSProperties } from 'react'
import styles from './Avatar.module.css'

export type AvatarProps = {
  name: string
  size?: number
  square?: boolean
}

const PALETTE_SIZE = 8

export function initialsOf(name: string): string {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function colorIndexOf(name: string): number {
  let hash = 7
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % PALETTE_SIZE) + 1
}

export default function Avatar({ name, size = 28, square = false }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.38)),
    background: `var(--av-${colorIndexOf(name)})`,
  } as CSSProperties
  return (
    <span className={`${styles.av} ${square ? styles.sq : ''}`} style={style} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}
