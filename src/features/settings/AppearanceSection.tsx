import { useTranslation } from 'react-i18next';
import { errorMessage } from '../../api/errorMessage';
import { useToast } from '../../components/useToast';
import { changeLanguage, isSavedLanguage, LANGUAGES, type Language } from '../../i18n';
import type { ThemePref } from '../../theme/themeContext';
import { useTheme } from '../../theme/useTheme';
import { useSession } from '../auth/useSession';
import styles from './Settings.module.css';
import swatches from './AppearanceSection.module.css';

const THEMES: ThemePref[] = ['light', 'dark', 'system'];

/** Apparence (SET-2) et langue de l'interface (SET-3), appliquées tout de suite. */
export function AppearanceSection() {
  const { t, i18n } = useTranslation();
  const { pref, setPref } = useTheme();
  const { updateMe } = useSession();
  const toast = useToast();
  const language = (i18n.resolvedLanguage ?? 'fr') as Language;

  const onLanguage = async (lang: Language) => {
    await changeLanguage(lang);
    // La langue est aussi enregistrée sur le compte (emails, autres appareils) tant que le
    // contrat l'accepte. Le portugais n'y est pas encore : il reste dans le localStorage.
    if (isSavedLanguage(lang)) {
      updateMe({ language: lang }).catch((error: unknown) => toast(errorMessage(t, error)));
    }
  };

  return (
    <section id="appearance" className={styles.section} aria-labelledby="settings-appearance-title">
      <h2 id="settings-appearance-title" className={styles.title}>
        {t('settings.appearance.title')}
      </h2>
      <p className={styles.intro}>{t('settings.appearance.intro')}</p>

      <fieldset className={swatches.fieldset}>
        <legend className={styles.subTitle}>{t('settings.appearance.theme')}</legend>
        <div className={styles.choices}>
          {THEMES.map((theme) => (
            <label key={theme} className={styles.choice}>
              <span className={`${swatches.swatch} ${swatches[theme]}`} aria-hidden="true">
                <i />
              </span>
              <span>
                <input
                  type="radio"
                  name="settings-theme"
                  value={theme}
                  checked={pref === theme}
                  onChange={() => setPref(theme)}
                />
                {t(`settings.appearance.themes.${theme}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={swatches.fieldset}>
        <legend className={styles.subTitle}>{t('language.label')}</legend>
        <div className={styles.choices}>
          {LANGUAGES.map((lang) => (
            <label key={lang} className={styles.choice} lang={lang}>
              <span>
                <input
                  type="radio"
                  name="settings-language"
                  value={lang}
                  checked={language === lang}
                  onChange={() => onLanguage(lang)}
                />
                {t(`language.${lang}`)}
              </span>
            </label>
          ))}
        </div>
        <p className={styles.intro}>{t('welcome.language.hint')}</p>
      </fieldset>
    </section>
  );
}
