import styles from './Avatar.module.css'

export type AvatarProps = {
  name: string
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function colorIndexOf(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 5
  return hash + 1
}

export default function Avatar({ name }: AvatarProps) {
  return (
    <span className={`${styles.avatar} ${styles[`color${colorIndexOf(name)}`]}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}
