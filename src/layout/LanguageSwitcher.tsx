import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES, type Language } from '../i18n';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage as Language;
  return (
    <div className={styles.seg} role="group" aria-label={t('language.label')}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={current === lang}
          onClick={() => changeLanguage(lang)}
        >
          {/* Le nom accessible commence par le texte visible (« FR »), pour la commande vocale. */}
          {lang.toUpperCase()}
          <span className="sr-only"> {t(`language.${lang}`)}</span>
        </button>
      ))}
    </div>
  );
}
