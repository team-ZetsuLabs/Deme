import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import Button from './Button'
import Icon from './Icon'
import Segmented from './Segmented'

type Language = 'fr' | 'en'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? t('prefs.toLight') : t('prefs.toDark')}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </Button>
  )
}

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const language: Language = i18n.language.startsWith('en') ? 'en' : 'fr'
  return (
    <Segmented<Language>
      label={t('prefs.language')}
      value={language}
      onChange={(next) => i18n.changeLanguage(next)}
      options={[
        { value: 'fr', label: 'FR' },
        { value: 'en', label: 'EN' },
      ]}
    />
  )
}
