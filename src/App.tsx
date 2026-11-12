import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/IconSprite';
import { ToastProvider } from './components/ToastProvider';
import { AuthPageFallback } from './pages/auth/AuthPageFallback';
import { RequireAuth } from './features/auth/RequireAuth';
import { SessionProvider } from './features/auth/SessionProvider';
import { UnreadProvider } from './features/notifications/UnreadProvider';
import { AppLayout } from './layout/AppLayout';
import { PageLoader } from './layout/PageLoader';
import { RouteErrorBoundary } from './layout/RouteErrorBoundary';
import { MaintenanceGate } from './layout/MaintenanceGate';
import { ThemeProvider } from './theme/ThemeProvider';
import { ChallengeSkeleton } from './components/skeleton/ChallengeSkeleton';
import { CommunityRowsSkeleton } from './components/skeleton/CommunityRowsSkeleton';
import { CommunitySkeleton } from './components/skeleton/CommunitySkeleton';
import { JobDetailSkeleton } from './components/skeleton/JobDetailSkeleton';
import { JobRowsSkeleton } from './components/skeleton/JobRowsSkeleton';
import { ListRowsSkeleton } from './components/skeleton/ListRowsSkeleton';
import { MissionDetailSkeleton } from './components/skeleton/MissionDetailSkeleton';
import { MissionRowsSkeleton } from './components/skeleton/MissionRowsSkeleton';
import { NotificationRowsSkeleton } from './components/skeleton/NotificationRowsSkeleton';
import { ProfileSkeleton } from './components/skeleton/ProfileSkeleton';
import { ProjectCardsSkeleton } from './components/skeleton/ProjectCardsSkeleton';
import { ProjectDetailSkeleton } from './components/skeleton/ProjectDetailSkeleton';
import { QuestionDetailSkeleton } from './components/skeleton/QuestionDetailSkeleton';
import { QuestionRowsSkeleton } from './components/skeleton/QuestionRowsSkeleton';

// Chaque page est chargée à la demande pour rester léger en 3G.
const HomePage = lazy(() => import('./pages/home/HomePage'));
const FeedPage = lazy(() => import('./pages/feed/FeedPage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email/VerifyEmailPage'));
const QuestionsPage = lazy(() => import('./pages/questions/QuestionsPage'));
const CommunitiesPage = lazy(() => import('./pages/communities/CommunitiesPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const NewCommunityPage = lazy(() => import('./pages/community-new/NewCommunityPage'));
const QuestionPage = lazy(() => import('./pages/question/QuestionPage'));
const EditQuestionPage = lazy(() => import('./pages/question-edit/EditQuestionPage'));
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
const PlaytestsPage = lazy(() => import('./pages/playtests/PlaytestsPage'));
const MyPlaytestsPage = lazy(() => import('./pages/playtests-mine/MyPlaytestsPage'));
const PlaytestPage = lazy(() => import('./pages/playtest/PlaytestPage'));
const NewPlaytestPage = lazy(() => import('./pages/playtest-new/NewPlaytestPage'));
const EditPlaytestPage = lazy(() => import('./pages/playtest-edit/EditPlaytestPage'));
const ChallengesPage = lazy(() => import('./pages/challenges/ChallengesPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectPage = lazy(() => import('./pages/project/ProjectPage'));
const NewProjectPage = lazy(() => import('./pages/project-new/NewProjectPage'));
const EditProjectPage = lazy(() => import('./pages/project-edit/EditProjectPage'));
const MyProjectsPage = lazy(() => import('./pages/my-projects/MyProjectsPage'));
const LegalPage = lazy(() => import('./pages/legal/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/notfound/NotFoundPage'));

/**
 * Suspense par page : pendant le téléchargement du chunk lazy, on affiche déjà le squelette
 * propre à la page (le même qu'elle montre pendant le chargement des données). Le shimmer
 * générique ne vient donc plus avant le shimmer particulier — c'est un seul squelette continu.
 */
function Lazy({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

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
                      <Route
                        path="login"
                        element={
                          <Suspense fallback={<AuthPageFallback mode="login" />}>
                            <AuthPage mode="login" />
                          </Suspense>
                        }
                      />
                      <Route
                        path="register"
                        element={
                          <Suspense fallback={<AuthPageFallback mode="register" />}>
                            <AuthPage mode="register" />
                          </Suspense>
                        }
                      />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                      <Route path="verify-email" element={<VerifyEmailPage />} />
                      <Route path="welcome" element={<WelcomePage />} />
                      <Route element={<AppLayout />}>
                        <Route
                          path="feed"
                          element={
                            <Lazy fallback={<ListRowsSkeleton count={5} />}>
                              <RequireAuth>
                                <FeedPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="questions"
                          element={
                            <Lazy fallback={<QuestionRowsSkeleton />}>
                              <QuestionsPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="questions/ask"
                          element={
                            <RequireAuth>
                              <AskPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="questions/:id"
                          element={
                            <Lazy fallback={<QuestionDetailSkeleton />}>
                              <QuestionPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="questions/:id/edit"
                          element={
                            <Lazy fallback={<QuestionDetailSkeleton />}>
                              <RequireAuth>
                                <EditQuestionPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="users/:username"
                          element={
                            <Lazy fallback={<ProfileSkeleton />}>
                              <ProfilePage />
                            </Lazy>
                          }
                        />
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
                            <Lazy fallback={<ListRowsSkeleton count={2} />}>
                              <RequireAuth>
                                <MyModerationPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="notifications"
                          element={
                            <Lazy fallback={<NotificationRowsSkeleton />}>
                              <RequireAuth>
                                <NotificationsPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="jobs"
                          element={
                            <Lazy fallback={<JobRowsSkeleton />}>
                              <JobsPage />
                            </Lazy>
                          }
                        />
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
                            <Lazy fallback={<JobRowsSkeleton />}>
                              <RequireAuth>
                                <MyJobsPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="jobs/:id"
                          element={
                            <Lazy fallback={<JobDetailSkeleton />}>
                              <JobPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="jobs/:id/edit"
                          element={
                            <Lazy fallback={<JobDetailSkeleton />}>
                              <RequireAuth>
                                <EditJobPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="applications"
                          element={
                            <Lazy fallback={<ListRowsSkeleton />}>
                              <RequireAuth>
                                <ApplicationsPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="missions"
                          element={
                            <Lazy fallback={<MissionRowsSkeleton />}>
                              <MissionsPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="missions/new"
                          element={
                            <RequireAuth>
                              <NewMissionPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="missions/:id"
                          element={
                            <Lazy fallback={<MissionDetailSkeleton />}>
                              <MissionPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="missions/:id/edit"
                          element={
                            <Lazy fallback={<MissionDetailSkeleton />}>
                              <RequireAuth>
                                <EditMissionPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="playtests"
                          element={
                            <Lazy fallback={<MissionRowsSkeleton />}>
                              <PlaytestsPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="playtests/new"
                          element={
                            <RequireAuth>
                              <NewPlaytestPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="playtests/mine"
                          element={
                            <Lazy fallback={<MissionRowsSkeleton />}>
                              <RequireAuth>
                                <MyPlaytestsPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="playtests/:id"
                          element={
                            <Lazy fallback={<JobDetailSkeleton />}>
                              <PlaytestPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="playtests/:id/edit"
                          element={
                            <Lazy fallback={<JobDetailSkeleton />}>
                              <RequireAuth>
                                <EditPlaytestPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="challenges"
                          element={
                            <Lazy fallback={<ChallengeSkeleton />}>
                              <ChallengesPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="projects"
                          element={
                            <Lazy fallback={<ProjectCardsSkeleton />}>
                              <ProjectsPage />
                            </Lazy>
                          }
                        />
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
                            <Lazy fallback={<ProjectCardsSkeleton />}>
                              <RequireAuth>
                                <MyProjectsPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="projects/:id"
                          element={
                            <Lazy fallback={<ProjectDetailSkeleton />}>
                              <ProjectPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="projects/:id/edit"
                          element={
                            <Lazy fallback={<ProjectDetailSkeleton />}>
                              <RequireAuth>
                                <EditProjectPage />
                              </RequireAuth>
                            </Lazy>
                          }
                        />
                        <Route
                          path="communities"
                          element={
                            <Lazy fallback={<CommunityRowsSkeleton />}>
                              <CommunitiesPage />
                            </Lazy>
                          }
                        />
                        <Route
                          path="communities/new"
                          element={
                            <RequireAuth>
                              <NewCommunityPage />
                            </RequireAuth>
                          }
                        />
                        <Route
                          path="communities/:slug"
                          element={
                            <Lazy fallback={<CommunitySkeleton />}>
                              <CommunityPage />
                            </Lazy>
                          }
                        />
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
