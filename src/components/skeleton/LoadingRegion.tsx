import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type LoadingRegionProps = { children: ReactNode; className?: string };

/**
 * Enveloppe d'un squelette : annonce « Chargement en cours » aux lecteurs d'écran
 * et leur masque les blocs gris, qui ne sont qu'une indication visuelle.
 */
export function LoadingRegion({ children, className }: LoadingRegionProps) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t('common.loading')}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
