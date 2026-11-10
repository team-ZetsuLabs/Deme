import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { PlaytestForm } from '../../features/playtests/PlaytestForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from '../ask/AskPage.module.css';

/** Créer une campagne de test fermé (TST-1). Réservée aux membres connectés (route). */
export default function NewPlaytestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('playtests.new.pageTitle'));

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('playtests.new.pageTitle')}</h1>
      <p className={styles.lead}>{t('playtests.new.lead')}</p>
      <PlaytestForm
        onSaved={(playtest) => {
          const key =
            playtest.status === 'ACTIVE'
              ? 'playtests.new.published'
              : playtest.status === 'PENDING_REVIEW'
                ? 'playtests.new.pendingReview'
                : 'playtests.new.draftSaved';
          toast(t(key));
          navigate(`/playtests/${playtest.id}`, { replace: true });
        }}
      />
    </section>
  );
}
