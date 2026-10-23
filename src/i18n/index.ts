import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const STORAGE_KEY = 'zetsu-bo-lang'

type Messages = Record<string, unknown>

/** Chaque fichier de src/i18n/<langue>/<espace>.json devient la clé de premier niveau <espace>. */
function load(files: Record<string, Messages>): Messages {
  const out: Messages = {}
  for (const [path, messages] of Object.entries(files)) {
    const name = path
      .split('/')
      .pop()
      ?.replace(/\.json$/, '')
    if (name) out[name] = messages
  }
  return out
}

const fr = load(import.meta.glob<Messages>('./fr/*.json', { eager: true, import: 'default' }))
const en = load(import.meta.glob<Messages>('./en/*.json', { eager: true, import: 'default' }))

function readStoredLanguage(): 'fr' | 'en' {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: readStoredLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // stockage indisponible : la langue reste valable pour la session
  }
})
document.documentElement.lang = i18n.language

export default i18n
