import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/IconSprite';
import { SessionProvider } from './features/auth/SessionProvider';
import { AppLayout } from './layout/AppLayout';
import { PageLoader } from './layout/PageLoader';
import { ThemeProvider } from './theme/ThemeProvider';

// Chaque page est chargée à la demande pour rester léger en 3G.
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const QuestionsPage = lazy(() => import('./pages/questions/QuestionsPage'));
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'));

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <IconSprite />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route element={<AppLayout />}>
                {/* La page d'accueil publique remplacera cette redirection. */}
                <Route index element={<Navigate to="/questions" replace />} />
                <Route path="questions" element={<QuestionsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}
