import type { ReactNode } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ConfirmProvider } from './components/ConfirmProvider'
import { ToastProvider } from './components/ToastProvider'
import { AdminStoreProvider } from './features/admin/AdminStore'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'

/** Tous les contextes de l'application, dans l'ordre de dépendance. */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <AdminStoreProvider>
            <ToastProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
          </AdminStoreProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
