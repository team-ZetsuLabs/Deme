import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuthorSummary } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Flag } from '../../components/Flag';
import { countryName } from '../../i18n/countries';
import styles from './MemberLine.module.css';

export type MemberLineProps = {
  member: AuthorSummary;
  /** Ligne secondaire : rôle tenu, date… */
  sub?: ReactNode;
  size?: number;
};

/** Membre d'un projet : avatar, nom (lien vers le profil), pays, ligne secondaire. */
export function MemberLine({ member, sub, size = 36 }: MemberLineProps) {
  const { t, i18n } = useTranslation();
  return (
    <div className={styles.line}>
      <Avatar name={member.displayName} photoUrl={member.avatarUrl ?? null} size={size} />
      <div className={styles.text}>
        <span className={styles.name}>
          {member.deleted ? (
            <span className={styles.deleted}>{t('projects.deletedMember')}</span>
          ) : (
            <Link to={`/users/${member.username}`}>{member.displayName}</Link>
          )}{' '}
          <Flag
            code={member.countryCode}
            label={countryName(member.countryCode ?? null, i18n.language)}
          />
        </span>
        {sub && <small className={styles.sub}>{sub}</small>}
      </div>
    </div>
  );
}
