import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/IconSprite';
import { ToastProvider } from './components/ToastProvider';
import { OnboardingGuard } from './features/auth/OnboardingGuard';
import { RequireAuth } from './features/auth/RequireAuth';
import { SessionProvider } from './features/auth/SessionProvider';
import { UnreadProvider } from './features/notifications/UnreadProvider';
import { AppLayout } from './layout/AppLayout';
import { PageLoader } from './layout/PageLoader';
import { RouteErrorBoundary } from './layout/RouteErrorBoundary';
import { MaintenanceGate } from './layout/MaintenanceGate';
import { ThemeProvider } from './theme/ThemeProvider';

// Chaque page est chargée à la demande pour rester léger en 3G.
const HomePage = lazy(() => import('./pages/home/HomePage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email/VerifyEmailPage'));
const QuestionsPage = lazy(() => import('./pages/questions/QuestionsPage'));
const CommunitiesPage = lazy(() => import('./pages/communities/CommunitiesPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const NewCommunityPage = lazy(() => import('./pages/community-new/NewCommunityPage'));
const QuestionPage = lazy(() => import('./pages/question/QuestionPage'));
const AskPage = lazy(() => import('./pages/ask/AskPage'));
const WelcomePage = lazy(() => import('./pages/welcome/WelcomePage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const ProfileEditPage = lazy(() => import('./pages/profile-edit/ProfileEditPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const JobsPage = lazy(() => import('./pages/jobs/JobsPage'));
const JobPage = lazy(() => import('./pages/job/JobPage'));
const NewJobPage = lazy(() => import('./pages/job-new/NewJobPage'));
const EditJobPage = lazy(() => import('./pages/job-edit/EditJobPage'));
const ApplicationsPage = lazy(() => import('./pages/applications/ApplicationsPage'));
const MyJobsPage = lazy(() => import('./pages/my-jobs/MyJobsPage'));
const MyModerationPage = lazy(() => import('./pages/my-moderation/MyModerationPage'));
const MissionsPage = lazy(() => import('./pages/missions/MissionsPage'));
const MissionPage = lazy(() => import('./pages/mission/MissionPage'));
const NewMissionPage = lazy(() => import('./pages/mission-new/NewMissionPage'));
const EditMissionPage = lazy(() => import('./pages/mission-edit/EditMissionPage'));
const ChallengesPage = lazy(() => import('./pages/challenges/ChallengesPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectPage = lazy(() => import('./pages/project/ProjectPage'));
const NewProjectPage = lazy(() => import('./pages/project-new/NewProjectPage'));
const EditProjectPage = lazy(() => import('./pages/project-edit/EditProjectPage'));
const MyProjectsPage = lazy(() => import('./pages/my-projects/MyProjectsPage'));
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'));

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <UnreadProvider>
            <IconSprite />
            <BrowserRouter>
              <MaintenanceGate>
                <RouteErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Accueil public ; un membre connecté est envoyé vers les questions. */}
                      <Route index element={<HomePage />} />
                      <Route path="login" element={<AuthPage mode="login" />} />
                      <Route path="register" element={<AuthPage mode="register" />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                      <Route path="verify-email" element={<VerifyEmailPage />} />
                      <Route path="welcome" element={<WelcomePage />} />
                      <Route
                        element={
                          <OnboardingGuard>
                            <AppLayout />
                          </OnboardingGuard>
                        }
                      >
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
                        <Route path="users/:username" element={<ProfilePage />} />
                        <Route
                          path="profile/edit"
                          element={
                            <RequireAuth>
                              <ProfileEditPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="settings"
                          element={
                            <RequireAuth>
                              <SettingsPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="moderation"
                          element={
                            <RequireAuth>
                              <MyModerationPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="notifications"
                          element={
                            <RequireAuth>
                              <NotificationsPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="jobs" element={<JobsPage />} />
                        <Route
                          path="jobs/new"
                          element={
                            <RequireAuth>
                              <NewJobPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="jobs/mine"
                          element={
                            <RequireAuth>
                              <MyJobsPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="jobs/:id" element={<JobPage />} />
                        <Route
                          path="jobs/:id/edit"
                          element={
                            <RequireAuth>
                              <EditJobPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="applications"
                          element={
                            <RequireAuth>
                              <ApplicationsPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="missions" element={<MissionsPage />} />
                        <Route
                          path="missions/new"
                          element={
                            <RequireAuth>
                              <NewMissionPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="missions/:id" element={<MissionPage />} />
                        <Route
                          path="missions/:id/edit"
                          element={
                            <RequireAuth>
                              <EditMissionPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="challenges" element={<ChallengesPage />} />
                        <Route path="projects" element={<ProjectsPage />} />
                        <Route
                          path="projects/new"
                          element={
                            <RequireAuth>
                              <NewProjectPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="projects/mine"
                          element={
                            <RequireAuth>
                              <MyProjectsPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="projects/:id" element={<ProjectPage />} />
                        <Route
                          path="projects/:id/edit"
                          element={
                            <RequireAuth>
                              <EditProjectPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="communities" element={<CommunitiesPage />} />
                        <Route
                          path="communities/new"
                          element={
                            <RequireAuth>
                              <NewCommunityPage />
                            </RequireAuth>
                          }
                        />
                        <Route path="communities/:slug" element={<CommunityPage />} />
                        <Route path="rules" element={<LegalPage doc="rules" />} />
                        <Route path="terms" element={<LegalPage doc="terms" />} />
                        <Route path="privacy" element={<LegalPage doc="privacy" />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </RouteErrorBoundary>
              </MaintenanceGate>
            </BrowserRouter>
          </UnreadProvider>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
