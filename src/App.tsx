import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Providers from './providers'
import StateMessage from './components/StateMessage'
import AdminLayout from './layout/AdminLayout'

const LoginPage = lazy(() => import('./pages/login/LoginPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))
const ReferentPage = lazy(() => import('./pages/referent/ReferentPage'))
const TagsPage = lazy(() => import('./pages/tags/TagsPage'))
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'))
const JobsPage = lazy(() => import('./pages/jobs/JobsPage'))
const ChallengesPage = lazy(() => import('./pages/challenges/ChallengesPage'))
const CommunitiesPage = lazy(() => import('./pages/communities/CommunitiesPage'))
const NewChallengePage = lazy(() => import('./pages/challenges/NewChallengePage'))
const NotFoundPage = lazy(() => import('./pages/not-found/NotFoundPage'))

export default function App() {
  const { t } = useTranslation()
  return (
    <Providers>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<StateMessage kind="loading" message={t('common.loading')} />}>
          <Routes>
            <Route path="connexion" element={<LoginPage />} />
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/tableau-de-bord" replace />} />
              <Route path="tableau-de-bord" element={<DashboardPage />} />
              <Route path="signalements" element={<ReportsPage />} />
              <Route path="referent" element={<ReferentPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="utilisateurs" element={<UsersPage />} />
              <Route path="utilisateurs/:username" element={<UserDetailPage />} />
              <Route path="offres" element={<JobsPage />} />
              <Route path="challenges" element={<ChallengesPage />} />
              <Route path="challenges/nouveau" element={<NewChallengePage />} />
              <Route path="communautes" element={<CommunitiesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  )
}
