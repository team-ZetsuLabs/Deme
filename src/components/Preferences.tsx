import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'
import SegmentedControl from './SegmentedControl'
import styles from './Preferences.module.css'

type Language = 'fr' | 'en'

export default function Preferences() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const language: Language = i18n.language.startsWith('en') ? 'en' : 'fr'

  return (
    <div className={styles.preferences}>
      <SegmentedControl<Theme>
        compact
        label={t('prefs.theme')}
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: t('prefs.light') },
          { value: 'dark', label: t('prefs.dark') },
        ]}
      />
      <SegmentedControl<Language>
        compact
        label={t('prefs.language')}
        value={language}
        onChange={(next) => i18n.changeLanguage(next)}
        options={[
          { value: 'fr', label: 'Français' },
          { value: 'en', label: 'English' },
        ]}
      />
    </div>
  )
}
