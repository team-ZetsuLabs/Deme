import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/IconSprite';
import { ToastProvider } from './components/ToastProvider';
import { OnboardingGuard } from './features/auth/OnboardingGuard';
import { RequireAuth } from './features/auth/RequireAuth';
import { SessionProvider } from './features/auth/SessionProvider';
import { AppLayout } from './layout/AppLayout';
import { PageLoader } from './layout/PageLoader';
import { ThemeProvider } from './theme/ThemeProvider';

// Chaque page est chargée à la demande pour rester léger en 3G.
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const QuestionsPage = lazy(() => import('./pages/questions/QuestionsPage'));
const QuestionPage = lazy(() => import('./pages/question/QuestionPage'));
const AskPage = lazy(() => import('./pages/ask/AskPage'));
const WelcomePage = lazy(() => import('./pages/welcome/WelcomePage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'));

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <IconSprite />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route path="welcome" element={<WelcomePage />} />
                <Route
                  element={
                    <OnboardingGuard>
                      <AppLayout />
                    </OnboardingGuard>
                  }
                >
                  {/* La page d'accueil publique remplacera cette redirection. */}
                  <Route index element={<Navigate to="/questions" replace />} />
                  <Route path="questions" element={<QuestionsPage />} />
                  <Route
                    path="questions/ask"
                    element={
                      <RequireAuth>
                        <AskPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="questions/:id" element={<QuestionPage />} />
                  <Route path="users/:id" element={<ProfilePage />} />
                  <Route
                    path="settings"
                    element={
                      <RequireAuth>
                        <SettingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
