import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { ProjectForm } from '../../features/projects/ProjectForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './NewProjectPage.module.css';

/** Proposer un projet (PRJ). Réservé aux membres connectés (voir la route). */
export default function NewProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('projects.new.pageTitle'));

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('projects.new.pageTitle')}</h1>
      <p className={styles.lead}>{t('projects.new.lead')}</p>
      <ProjectForm
        onSaved={(project) => {
          toast(t('projects.new.created'));
          navigate(`/projects/${project.id}`, { replace: true });
        }}
      />
    </section>
  );
}
