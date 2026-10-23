import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import StateMessage from './components/StateMessage'
import { ThemeProvider } from './hooks/useTheme'
import AdminLayout from './layout/AdminLayout'

const LoginPage = lazy(() => import('./pages/login/LoginPage'))
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'))
const JobsPage = lazy(() => import('./pages/jobs/JobsPage'))
const UsersPage = lazy(() => import('./pages/users/UsersPage'))
const TagsPage = lazy(() => import('./pages/tags/TagsPage'))
const ChallengesPage = lazy(() => import('./pages/challenges/ChallengesPage'))
const ReferentPage = lazy(() => import('./pages/referent/ReferentPage'))

export default function App() {
  const { t } = useTranslation()
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<StateMessage kind="loading" message={t('common.loading')} />}>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/reports" replace />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="challenges" element={<ChallengesPage />} />
              <Route path="referent" element={<ReferentPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}
