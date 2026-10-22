import { useTranslation } from 'react-i18next';
import { spinnerClass } from '../components/buttonClass';
import styles from './PageLoader.module.css';

/** Affiché pendant le chargement d'une page découpée en React.lazy. */
export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className={styles.loader} role="status">
      <span className={spinnerClass} aria-hidden="true" />
      <span>{t('common.loading')}</span>
    </div>
  );
}
