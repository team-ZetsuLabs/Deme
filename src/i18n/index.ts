import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Le français, langue de la majorité du public, est dans le fichier principal.
// L'anglais n'est téléchargé que s'il est choisi : la première page reste légère en 3G.
import fr from './fr.json';

export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'zetsu-lang';

const loaders: Record<Exclude<Language, 'fr'>, () => Promise<{ default: object }>> = {
  en: () => import('./en.json'),
};

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    // stockage indisponible
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

/** Télécharge les textes d'une langue s'ils ne sont pas encore chargés. */
export async function loadLanguage(lang: Language): Promise<void> {
  if (lang === 'fr' || i18n.hasResourceBundle(lang, 'translation')) return;
  const bundle = await loaders[lang]();
  i18n.addResourceBundle(lang, 'translation', bundle.default, true, true);
}

/** Affiche l'interface dans une langue, sans l'enregistrer comme choix du visiteur. */
async function applyLanguage(lang: Language) {
  try {
    await loadLanguage(lang);
  } catch {
    // hors ligne et fichier absent du cache : on reste sur la langue actuelle
    return;
  }
  await i18n.changeLanguage(lang);
}

/** Choix explicite du visiteur : mémorisé pour ses prochaines visites. */
export async function changeLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // le choix reste valable pour la session
  }
  await applyLanguage(lang);
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// En test, on reste en français : les tests choisissent eux-mêmes leur langue.
const start: Language = import.meta.env.MODE === 'test' ? 'fr' : initialLanguage();

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  partialBundledLanguages: true,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }, // React échappe déjà le texte
});

/** Prêt quand la langue de départ est chargée ; main.tsx attend avant le premier affichage. */
export const i18nReady: Promise<void> =
  start === 'fr' ? Promise.resolve() : applyLanguage(start).catch(() => undefined);

export default i18n;
