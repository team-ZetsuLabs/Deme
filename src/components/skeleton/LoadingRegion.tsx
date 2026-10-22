import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionQuality } from '../../hooks/useConnectionQuality';
import { Icon } from '../Icon';
import styles from './LoadingRegion.module.css';

/** Au-delà de ce délai, on prévient que le chargement prend du temps, même sans réseau lent détecté. */
export const SLOW_AFTER_MS = 4000;

export type LoadingRegionProps = { children: ReactNode; className?: string };

/**
 * Écran de chargement : le squelette, plus un message lié à l'état de la connexion.
 * - hors ligne : le chargement attendra le retour du réseau (voir useApiQuery) ;
 * - réseau lent, ou chargement de plus de 4 secondes : on prévient que ce sera un peu long.
 * Les lecteurs d'écran entendent le message ; les blocs gris leur sont masqués.
 */
export function LoadingRegion({ children, className }: LoadingRegionProps) {
  const { t } = useTranslation();
  const quality = useConnectionQuality();
  const [late, setLate] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLate(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const message =
    quality === 'offline'
      ? t('network.loadingOffline')
      : quality === 'slow' || late
        ? t('network.loadingSlow')
        : null;

  return (
    <div role="status" aria-busy="true" className={styles.region}>
      {message ? (
        <p className={quality === 'offline' ? `${styles.notice} ${styles.offline}` : styles.notice}>
          <Icon name={quality === 'offline' ? 'offline' : 'clock'} size={16} />
          {message}
        </p>
      ) : (
        <span className="sr-only">{t('common.loading')}</span>
      )}
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  );
}
