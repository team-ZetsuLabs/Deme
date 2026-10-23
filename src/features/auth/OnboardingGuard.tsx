import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './useSession';

type OnboardingGuardProps = { children: ReactNode };

/**
 * Envoie un membre qui n'a pas fini le parcours d'accueil (AUTH-5) vers /welcome,
 * qu'il vienne de l'inscription par email ou d'un premier passage par GitHub ou Google.
 * Le contrat ne renvoie pas encore `onboarded` : sans ce champ, le parcours est considéré comme fait.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user } = useSession();
  const location = useLocation();
  if (user?.onboarded === false) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
