import { useMemo } from 'react';
import styles from './MemberContent.module.css';
import { sanitizeMemberHtml } from './sanitize';

export type MemberContentProps = {
  /** HTML produit et nettoyé par le serveur à partir du Markdown du membre. */
  html: string;
  className?: string;
};

/**
 * Seul composant autorisé à utiliser dangerouslySetInnerHTML (voir CLAUDE.md).
 * Le HTML repasse par DOMPurify avant l'affichage.
 */
export function MemberContent({ html, className }: MemberContentProps) {
  const clean = useMemo(() => sanitizeMemberHtml(html), [html]);
  const classes = className ? `${styles.content} ${className}` : styles.content;
  return <div className={classes} dangerouslySetInnerHTML={{ __html: clean }} />;
}
