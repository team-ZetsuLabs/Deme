import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Author } from '../../api/provisional-types';
import { Avatar } from '../../components/Avatar';
import styles from './AuthorCard.module.css';

export type AuthorCardProps = { author: Author; label: ReactNode };

/** Auteur d'un contenu : avatar, nom, réputation. */
export function AuthorCard({ author, label }: AuthorCardProps) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.card}>
      <Avatar name={author.name} photoUrl={author.photoUrl} size={32} />
      <div>
        <small className={styles.label}>{label}</small>
        <span className={styles.name}>{author.name}</span>{' '}
        <span className={styles.rep}>
          {t('question.points', { points: author.reputation.toLocaleString(i18n.language) })}
        </span>
      </div>
    </div>
  );
}
