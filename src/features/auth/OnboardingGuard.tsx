import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './useSession';

type OnboardingGuardProps = { children: ReactNode };

/**
 * Envoie un membre qui n'a pas fini le parcours d'accueil (AUTH-5) vers /welcome,
 * qu'il vienne de l'inscription par email ou d'un premier passage par GitHub ou Google.
 * « Plus tard » le laisse passer jusqu'à sa prochaine visite.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, onboardingSkipped } = useSession();
  const location = useLocation();
  if (user && !user.onboardingCompleted && !onboardingSkipped) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
