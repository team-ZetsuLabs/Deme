import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../../layout/PageLoader';
import { useSession } from './useSession';

type RequireAuthProps = { children: ReactNode };

/**
 * Réserve une page aux membres connectés, puis y revient après la connexion.
 * Confort d'interface seulement : le serveur vérifie chaque droit (cahier, section 10).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
