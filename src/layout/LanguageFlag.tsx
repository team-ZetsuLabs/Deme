import type { Language } from '../i18n';
import styles from './LanguageFlag.module.css';

export type LanguageFlagProps = { lang: Language };

/**
 * Petit drapeau du pays de référence de la langue, dessiné en SVG (pas d'emoji ni d'image à
 * charger). Décoratif : le nom de la langue est toujours écrit à côté.
 */
export function LanguageFlag({ lang }: LanguageFlagProps) {
  if (lang === 'en') {
    return (
      <svg className={styles.flag} viewBox="0 0 60 40" aria-hidden="true" focusable="false">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0 0 60 40 M60 0 0 40" stroke="#ffffff" strokeWidth="8" />
        <path d="M0 0 60 40 M60 0 0 40" stroke="#c8102e" strokeWidth="3.5" />
        <path d="M30 0 V40 M0 20 H60" stroke="#ffffff" strokeWidth="12" />
        <path d="M30 0 V40 M0 20 H60" stroke="#c8102e" strokeWidth="7" />
      </svg>
    );
  }
  if (lang === 'pt') {
    return (
      <svg className={styles.flag} viewBox="0 0 60 40" aria-hidden="true" focusable="false">
        <rect width="60" height="40" fill="#da291c" />
        <rect width="24" height="40" fill="#046a38" />
        <circle cx="24" cy="20" r="7" fill="#ffe000" stroke="#ffffff" strokeWidth="1" />
        <circle cx="24" cy="20" r="3" fill="#da291c" />
      </svg>
    );
  }
  return (
    <svg className={styles.flag} viewBox="0 0 3 2" aria-hidden="true" focusable="false">
      <rect width="3" height="2" fill="#ffffff" />
      <rect width="1" height="2" fill="#0055a4" />
      <rect x="2" width="1" height="2" fill="#ef4135" />
    </svg>
  );
}
