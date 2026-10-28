import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { changeLanguage, LANGUAGES, type Language } from '../i18n';
import { LanguageFlag } from './LanguageFlag';
import styles from './LanguageSwitcher.module.css';

/** Choix de la langue : drapeau + code actuel, avec un menu pour les autres langues. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current: Language = LANGUAGES.find((lang) => lang === i18n.resolvedLanguage) ?? 'fr';
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const pick = (lang: Language) => {
    setOpen(false);
    buttonRef.current?.focus();
    if (lang !== current) void changeLanguage(lang);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <LanguageFlag lang={current} />
        {/* Le code visible (« FR ») vient d'abord, puis le libellé pour la commande vocale. */}
        <span className={styles.code}>{current.toUpperCase()}</span>
        <span className="sr-only"> {t('language.label')}</span>
        <Icon name="up" className={styles.caret} />
      </button>
      <div id={menuId} className={styles.menu} role="menu" hidden={!open}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            role="menuitemradio"
            aria-checked={current === lang}
            lang={lang}
            className={styles.item}
            onClick={() => pick(lang)}
          >
            <LanguageFlag lang={lang} />
            <span className={styles.itemName}>{t(`language.${lang}`)}</span>
            {current === lang && <Icon name="check" className={styles.check} />}
          </button>
        ))}
      </div>
    </div>
  );
}
