import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/useToast';
import { useSession } from '../../features/auth/useSession';
import { AskForm } from '../../features/questions/AskForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './AskPage.module.css';

/** Page « Poser une question », réservée aux membres connectés (voir la route). */
export default function AskPage() {
  const { t } = useTranslation();
  const { user } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  usePageTitle(t('ask.pageTitle'));

  return (
    <section className={styles.panel}>
      <h1 className={styles.title}>{t('ask.title')}</h1>
      <p className={styles.lead}>{t('ask.lead')}</p>
      <AskForm
        initialTitle={params.get('title') ?? ''}
        defaultCountry={user?.countryCode ?? null}
        onPosted={(question) => {
          toast(t('ask.posted'));
          navigate(`/questions/${question.id}`, { replace: true });
        }}
      />
    </section>
  );
}
