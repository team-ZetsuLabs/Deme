import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ProjectStatus, ProjectSummary } from '../../api/types'
import Avatar from '../../components/Avatar'
import { cell, TableWrap, Who } from '../../components/DataTable'
import { Pill, Status, Tag, Tags } from '../../components/Status'
import { formatAgo } from '../admin/format'

export const PROJECT_TONE: Record<ProjectStatus, 'good' | 'warn' | 'neutral'> = {
  OPEN: 'good',
  IN_PROGRESS: 'good',
  PAUSED: 'warn',
  CLOSED: 'neutral',
}

export type ProjectTableProps = {
  items: ProjectSummary[]
  /** Affiche le rôle du membre (porteur ou membre) plutôt que le porteur, sur la fiche d'un membre. */
  memberUsername?: string
}

export default function ProjectTable({ items, memberUsername }: ProjectTableProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  return (
    <TableWrap>
      <thead>
        <tr>
          <th>{t('projects.col.project')}</th>
          <th className={cell.hideSm}>
            {memberUsername ? t('users.member.roleMember') : t('projects.col.owner')}
          </th>
          <th className={cell.hideSm}>{t('projects.col.type')}</th>
          <th className={cell.hideSm}>{t('projects.col.team')}</th>
          <th>{t('projects.col.status')}</th>
          <th className={`${cell.right} ${cell.hideSm}`}>{t('projects.col.activity')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((project) => (
          <tr key={project.id}>
            <td>
              <Link className={cell.title} to={`/projets/${project.id}`}>
                {project.title}
              </Link>
              <Tags>
                {project.technologies.slice(0, 3).map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </Tags>
            </td>
            <td className={cell.hideSm}>
              {memberUsername ? (
                <Pill>
                  {project.owner.username === memberUsername
                    ? t('users.member.roleOwner')
                    : t('users.member.roleMember')}
                </Pill>
              ) : (
                <Link to={`/utilisateurs/${encodeURIComponent(project.owner.username)}`}>
                  <Who
                    avatar={<Avatar name={project.owner.displayName} size={28} />}
                    name={project.owner.displayName}
                  />
                </Link>
              )}
            </td>
            <td className={cell.hideSm}>{t(`projectType.${project.type}`)}</td>
            <td className={cell.hideSm}>
              {t('projects.teamSize', { count: project.teamSize })}
              <small className={cell.sub}>
                {project.openRoles.length
                  ? t('projects.openRolesCount', { count: project.openRoles.length })
                  : t('projects.noOpenRoles')}
              </small>
            </td>
            <td>
              <Status tone={PROJECT_TONE[project.status]}>
                {t(`projectStatus.${project.status}`)}
              </Status>
            </td>
            <td className={`${cell.right} ${cell.muted} ${cell.hideSm}`}>
              {formatAgo(project.lastActivityAt, lang)}
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  )
}
