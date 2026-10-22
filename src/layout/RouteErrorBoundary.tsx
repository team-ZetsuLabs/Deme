import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RouteErrorFallback } from './RouteErrorFallback';

type RouteErrorBoundaryProps = { children: ReactNode };
type RouteErrorBoundaryState = { failed: boolean };

/**
 * Attrape une page qui n'a pas pu être chargée (fichier de la page indisponible hors ligne,
 * erreur inattendue) pour ne pas laisser un écran blanc.
 * Exception à la règle « composants en fonctions » du CLAUDE.md : React n'offre les
 * périmètres d'erreur qu'en classe.
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page non chargée', error, info.componentStack);
  }

  render() {
    return this.state.failed ? <RouteErrorFallback /> : this.props.children;
  }
}
