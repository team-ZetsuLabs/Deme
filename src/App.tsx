import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from './layout/AdminLayout'

const HomePage = lazy(() => import('./pages/home/HomePage'))

export default function App() {
  const { t } = useTranslation()
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<p>{t('common.loading')}</p>}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
