import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Alphabet latin seulement (accents français inclus) : la page reste légère en 3G.
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-500.css';
import '@fontsource/hanken-grotesk/latin-600.css';
import '@fontsource/hanken-grotesk/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import './styles/tokens.css';
import './styles/base.css';
import { i18nReady } from './i18n';
import { prefetchRoute } from './api/prefetchRoute';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

// Données de la page lancées tout de suite, en parallèle du code de la page (React.lazy).
prefetchRoute(window.location.pathname, window.location.search);

// Pour un visiteur anglophone, on attend le fichier anglais : pas de flash de texte français.
void i18nReady.finally(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
