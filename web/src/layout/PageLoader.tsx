import { LoadingRegion } from '../components/skeleton/LoadingRegion';
import { Skeleton } from '../components/skeleton/Skeleton';
import styles from './PageLoader.module.css';

/**
 * Squelette générique : pendant le chargement d'une page découpée en React.lazy,
 * ou quand l'écran n'a pas encore de squelette sur mesure.
 */
export function PageLoader() {
  return (
    <LoadingRegion className={styles.loader}>
      <Skeleton width="42%" height={26} />
      <Skeleton width="68%" height={14} className={styles.lead} />
      <div className={styles.panel}>
        <Skeleton width="75%" height={15} />
        <Skeleton height={12} />
        <Skeleton width="58%" height={12} />
        <Skeleton width="82%" height={15} className={styles.spaced} />
        <Skeleton height={12} />
        <Skeleton width="46%" height={12} />
      </div>
    </LoadingRegion>
  );
}
