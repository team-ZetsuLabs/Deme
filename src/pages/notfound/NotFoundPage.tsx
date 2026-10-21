import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <section className={styles.panel}>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.text}>{t('notFound.text')}</p>
      <Link to="/questions" className={`${buttonClass({ variant: 'primary' })} ${styles.back}`}>
        {t('notFound.back')}
      </Link>
    </section>
  );
}
