import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './LegalPage.module.css';

export type LegalDoc = 'rules' | 'terms' | 'privacy';

type LegalSection = { title: string; paragraphs: string[] };

function isSections(value: unknown): value is LegalSection[] {
  return (
    Array.isArray(value) &&
    value.every(
      (s) =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as LegalSection).title === 'string' &&
        Array.isArray((s as LegalSection).paragraphs),
    )
  );
}

const DOCS: LegalDoc[] = ['rules', 'terms', 'privacy'];
const PATHS: Record<LegalDoc, string> = { rules: '/rules', terms: '/terms', privacy: '/privacy' };

// Adresse de contact fournie au déploiement (.env), jamais inventée dans le code.
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

export type LegalPageProps = { doc: LegalDoc };

/** Règles de la communauté, conditions d'utilisation et confidentialité (cahier, section 12). */
export default function LegalPage({ doc }: LegalPageProps) {
  const { t } = useTranslation();
  usePageTitle(t(`legal.${doc}.title`));
  const raw: unknown = t(`legal.${doc}.sections`, { returnObjects: true });
  const sections = isSections(raw) ? raw : [];

  return (
    <article className={styles.page}>
      <nav className={styles.docs} aria-label={t('legal.docsLabel')}>
        {DOCS.map((d) => (
          <Link key={d} to={PATHS[d]} aria-current={d === doc ? 'page' : undefined}>
            {t(`legal.${d}.title`)}
          </Link>
        ))}
      </nav>

      <header className={styles.head}>
        <h1 className={styles.title}>{t(`legal.${doc}.title`)}</h1>
        <p className={styles.intro}>{t(`legal.${doc}.intro`)}</p>
        <p className={styles.updated}>{t('legal.updated')}</p>
      </header>

      <nav className={styles.toc} aria-label={t('legal.tocLabel')}>
        <ol>
          {sections.map((s, i) => (
            <li key={s.title}>
              <a href={`#${doc}-${i + 1}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.title} id={`${doc}-${i + 1}`} className={styles.section}>
          <h2>
            <span className={styles.number} aria-hidden="true">
              {i + 1}.
            </span>{' '}
            {s.title}
          </h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}

      {CONTACT_EMAIL && (
        <p className={styles.contact}>
          {t('legal.contact')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
    </article>
  );
}
