import { useTranslation } from 'react-i18next';
import type { ProjectTeamMember } from '../../api/types';
import { MemberLine } from './MemberLine';
import styles from './ProjectTeam.module.css';

export type ProjectTeamProps = { team: ProjectTeamMember[] };

/** Équipe du projet : porteur et membres, avec le rôle tenu. */
export function ProjectTeam({ team }: ProjectTeamProps) {
  const { t } = useTranslation();
  if (team.length === 0) return null;
  return (
    <ul className={styles.list}>
      {team.map((entry) => (
        <li key={entry.member.username} className={styles.item}>
          <MemberLine
            member={entry.member}
            sub={
              entry.owner ? t('projects.ownerRole') : (entry.roleTitle ?? t('projects.contributor'))
            }
          />
        </li>
      ))}
    </ul>
  );
}
