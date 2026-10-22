import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Alphabet latin seulement (accents français inclus) : la page reste légère en 3G.
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist/latin-700.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/geist-mono/latin-600.css';
import './styles/tokens.css';
import './styles/base.css';
import { i18nReady } from './i18n';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

// Pour un visiteur anglophone, on attend le fichier anglais : pas de flash de texte français.
void i18nReady.finally(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
