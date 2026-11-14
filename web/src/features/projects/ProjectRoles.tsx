import { useTranslation } from 'react-i18next';
import type { ProjectRole } from '../../api/types';
import { MemberLine } from './MemberLine';
import styles from './ProjectRoles.module.css';

export type ProjectRolesProps = { roles: ProjectRole[] };

/** Rôles recherchés sur le projet : ouverts (à pourvoir) ou tenus par un membre. */
export function ProjectRoles({ roles }: ProjectRolesProps) {
  const { t } = useTranslation();
  if (roles.length === 0) return null;
  return (
    <ul className={styles.list}>
      {roles.map((role) => (
        <li key={role.id} className={styles.role}>
          <div className={styles.head}>
            <span className={styles.title}>{role.title}</span>
            <span className={`${styles.status} ${styles[role.status]}`}>
              {t(`projects.roleStatus.${role.status}`)}
            </span>
          </div>
          {role.technologies.length > 0 && (
            <ul className={styles.tags}>
              {role.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          )}
          {role.member && (
            <div className={styles.member}>
              <MemberLine member={role.member} size={28} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
