import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/IconSprite';
import { AppLayout } from './layout/AppLayout';
import { ThemeProvider } from './theme/ThemeProvider';

// Chaque page est chargée à la demande pour rester léger en 3G.
const QuestionsPage = lazy(() => import('./pages/questions/QuestionsPage'));
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'));

export function App() {
  return (
    <ThemeProvider>
      <IconSprite />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* La page d'accueil publique remplacera cette redirection. */}
            <Route index element={<Navigate to="/questions" replace />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
