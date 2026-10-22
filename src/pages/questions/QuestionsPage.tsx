import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './QuestionsPage.module.css';

/** Fil des questions (QA-6). Contenu à venir dans le sprint 1. */
export default function QuestionsPage() {
  const { t } = useTranslation();
  usePageTitle(t('questions.title'));
  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('questions.title')}</h1>
      <p className={styles.lead}>{t('questions.lead')}</p>
    </section>
  );
}
