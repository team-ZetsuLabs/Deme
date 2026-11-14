import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Le français, langue de la majorité du public, est dans le fichier principal.
// L'anglais n'est téléchargé que s'il est choisi : la première page reste légère en 3G.
import fr from './fr.json';

export const LANGUAGES = ['fr', 'en', 'pt', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

// Langues écrites de droite à gauche : on bascule l'attribut `dir` du document (voir plus bas).
const RTL_LANGUAGES: readonly string[] = ['ar'];

/** La langue s'écrit-elle de droite à gauche ? */
export function isRtlLanguage(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang);
}

// Langues que le profil sait enregistrer aujourd'hui (enum du contrat d'API, figé à fr/en).
// Le portugais ne vit pour l'instant que dans le localStorage ; dès que le back-end l'ajoute
// à l'enum `language`, on l'ajoute ici pour que le choix suive le membre d'un appareil à l'autre.
export const SAVED_LANGUAGES = ['fr', 'en'] as const;
export type SavedLanguage = (typeof SAVED_LANGUAGES)[number];

/** La langue peut-elle être enregistrée dans le profil (sinon : localStorage seulement) ? */
export function isSavedLanguage(lang: Language): lang is SavedLanguage {
  return (SAVED_LANGUAGES as readonly string[]).includes(lang);
}

const STORAGE_KEY = 'zetsu-lang';

const loaders: Record<Exclude<Language, 'fr'>, () => Promise<{ default: object }>> = {
  en: () => import('./en.json'),
  pt: () => import('./pt.json'),
  ar: () => import('./ar.json'),
};

function initialLanguage(): Language {
  try {
    const saved = LANGUAGES.find((lang) => lang === localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // stockage indisponible
  }
  const navLang = navigator.language.toLowerCase();
  return LANGUAGES.find((lang) => lang !== 'fr' && navLang.startsWith(lang)) ?? 'fr';
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
  // L'arabe met toute l'interface en droite-à-gauche (les styles s'appuient sur `dir`).
  document.documentElement.dir = isRtlLanguage(lng) ? 'rtl' : 'ltr';
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
