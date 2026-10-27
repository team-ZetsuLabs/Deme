import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuthorSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Flag } from '../../components/Flag';
import { countryName } from '../../i18n/countries';
import styles from './AuthorCard.module.css';

export type AuthorCardProps = { author: AuthorSummary; label: ReactNode };

/** Auteur d'un contenu : avatar, nom (lien vers son profil), réputation. */
export function AuthorCard({ author, label }: AuthorCardProps) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.card}>
      <Avatar name={author.displayName} photoUrl={author.avatarUrl ?? null} size={32} />
      <div>
        <small className={styles.label}>{label}</small>
        <Link to={`/users/${author.username}`} className={styles.name}>
          {author.displayName}
        </Link>{' '}
        <Flag
          code={author.countryCode}
          label={countryName(author.countryCode ?? null, i18n.language)}
        />{' '}
        <span className={styles.rep}>
          {t('question.points', { points: author.reputation.toLocaleString(i18n.language) })}
        </span>
      </div>
    </div>
  );
}
