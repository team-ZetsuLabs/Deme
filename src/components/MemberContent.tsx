import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import styles from './MemberContent.module.css'

export type MemberContentProps = {
  html: string
}

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'h3',
  'h4',
]

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer nofollow')
    node.setAttribute('target', '_blank')
  }
})

export function sanitizeMemberHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  })
}

/**
 * Seul endroit du dépôt autorisé à utiliser dangerouslySetInnerHTML :
 * le HTML d'un membre repasse par DOMPurify avant l'affichage.
 */
export default function MemberContent({ html }: MemberContentProps) {
  const clean = useMemo(() => sanitizeMemberHtml(html), [html])
  return <div className={styles.content} dangerouslySetInnerHTML={{ __html: clean }} />
}
