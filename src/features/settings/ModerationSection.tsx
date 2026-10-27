import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '../../components/buttonClass';
import styles from './Settings.module.css';

/** Accès à mes contenus signalés ou masqués, et à la contestation (MOD-3). */
export function ModerationSection() {
  const { t } = useTranslation();
  return (
    <section id="moderation" className={styles.section} aria-labelledby="settings-moderation-title">
      <h2 id="settings-moderation-title" className={styles.title}>
        {t('settings.moderation.title')}
      </h2>
      <p className={styles.intro}>{t('settings.moderation.intro')}</p>
      <Link to="/moderation" className={buttonClass({ size: 'sm', variant: 'secondary' })}>
        {t('settings.moderation.link')}
      </Link>
    </section>
  );
}
