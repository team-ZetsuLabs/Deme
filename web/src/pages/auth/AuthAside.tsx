import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import styles from './AuthAside.module.css';

// Extrait de code d'illustration : le code n'est pas traduit.
const SNIPPET = `headers: {
  "Authorization": \`Bearer \${token}\`,
  "Content-Type": "application/json"
}  // renouveler le token avant expiration`;

/** Aperçu d'un fil résolu, pour montrer la plateforme en un coup d'œil. Contenu illustratif. */
export function AuthAside() {
  const { t } = useTranslation();
  return (
    <aside className={styles.side} aria-label={t('auth.aside.label')}>
      <div className={styles.inner}>
        <h2 className={styles.title}>{t('auth.aside.title')}</h2>
        <p className={styles.sub}>{t('auth.aside.sub')}</p>

        <div className={styles.thread}>
          <div className={styles.bar}>
            <span className={styles.dot} aria-hidden="true" />
            {t('auth.aside.status')}
          </div>
          <div className={styles.post}>
            <Avatar name="Awa Kane" size={32} />
            <div>
              <h3>{t('auth.aside.questionTitle')}</h3>
              <p>{t('auth.aside.questionBody')}</p>
              <p className={styles.by}>Awa Kane, Dakar</p>
            </div>
          </div>
          <div className={`${styles.post} ${styles.accepted}`}>
            <Avatar name="Ibrahim Sawadogo" size={32} />
            <div>
              <span className={styles.acceptedTag}>
                <Icon name="check" size={14} />
                {t('auth.aside.accepted')}
              </span>
              <p>{t('auth.aside.answerBody')}</p>
              <pre className={styles.code}>{SNIPPET}</pre>
              <p className={styles.by}>
                Ibrahim Sawadogo, Ouagadougou
                <span className={styles.rep}>{t('auth.aside.reputation')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
