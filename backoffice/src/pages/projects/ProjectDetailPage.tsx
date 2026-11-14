import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { adminApi, publicApi } from '../../api/endpoints'
import type { ProjectDetail } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import { ButtonLink } from '../../components/Button'
import { cell, Who } from '../../components/DataTable'
import MemberContent from '../../components/MemberContent'
import { EmptyState, Grid2, Panel, PanelBody, PanelHead } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { Pill, Status, Tag, Tags } from '../../components/Status'
import { formatAgo, formatDate } from '../../features/admin/format'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import { PROJECT_TONE } from '../../features/projects/ProjectTable'
import { useCrumbs } from '../../layout/crumbs'
import styles from './ProjectDetailPage.module.css'

const CASE_TONE = {
  OPEN: 'warn',
  APPEALED: 'warn',
  HIDDEN: 'crit',
  DISMISSED: 'neutral',
  RESTORED: 'good',
} as const

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { t } = useTranslation()
  const query = useQuery((signal) => publicApi.project(projectId, { signal }), [projectId])
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.projects'), to: '/projets' },
    { label: query.data?.title ?? t('common.loading') },
  ])
  return <QueryState query={query}>{(project) => <Detail project={project} />}</QueryState>
}

function Detail({ project }: { project: ProjectDetail }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const github = project.githubUrl ? safeHttpUrl(project.githubUrl) : null
  const contact = project.contactUrl ? safeHttpUrl(project.contactUrl) : null

  const updates = useQuery(
    (signal) => publicApi.projectUpdates(project.id, { signal }),
    [project.id],
  )
  const reports = useQuery(
    async (signal) => {
      const page = await adminApi.listCases({ targetType: 'PROJECT', size: 50 }, { signal })
      return page.items.filter((c) => c.target.id === project.id)
    },
    [project.id],
  )

  return (
    <>
      <Panel>
        <PanelBody className={styles.head}>
          <div>
            <h1>{project.title}</h1>
            <p className={styles.sub}>
              {t(`projectType.${project.type}`)}
              {', '}
              {t('projects.detail.createdOn', { date: formatDate(project.createdAt, lang) })}
              {', '}
              {t('projects.detail.activity', { ago: formatAgo(project.lastActivityAt, lang) })}
            </p>
            <div style={{ marginTop: 6 }}>
              <Status tone={PROJECT_TONE[project.status]}>
                {t(`projectStatus.${project.status}`)}
              </Status>
            </div>
          </div>
          <ButtonLink to="/projets">{t('projects.detail.back')}</ButtonLink>
        </PanelBody>
      </Panel>

      <Grid2 className={styles.below}>
        <div className={styles.column}>
          <Panel>
            <PanelHead title={t('projects.detail.description')} />
            <PanelBody>
              <MemberContent html={project.descriptionHtml} />
              <h3 className={styles.subtitle}>{t('projects.detail.technologies')}</h3>
              <Tags>
                {project.technologies.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </Tags>
              {(github || contact) && (
                <>
                  <h3 className={styles.subtitle}>{t('projects.detail.links')}</h3>
                  <ul className={styles.links}>
                    {github && (
                      <li>
                        {t('projects.detail.github')} :{' '}
                        <a href={github} target="_blank" rel="noopener noreferrer">
                          {github}
                        </a>
                      </li>
                    )}
                    {contact && (
                      <li>
                        {t('projects.detail.contact')} :{' '}
                        <a href={contact} target="_blank" rel="noopener noreferrer">
                          {contact}
                        </a>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title={t('projects.detail.updates')} />
            <QueryState
              query={updates}
              isEmpty={(d) => d.items.length === 0}
              empty={<EmptyState title={t('projects.detail.noUpdates')} />}
            >
              {(d) => (
                <PanelBody>
                  <ul className={styles.timeline}>
                    {d.items.map((update) => (
                      <li key={update.id}>
                        <time>{formatAgo(update.createdAt, lang)}</time>
                        <span>
                          <b>{update.author.displayName}</b>
                          <br />
                          {update.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </PanelBody>
              )}
            </QueryState>
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel>
            <PanelHead title={t('projects.detail.team')} />
            <PanelBody>
              <ul className={styles.team}>
                {project.team.map((m) => (
                  <li key={m.member.username}>
                    <Link to={`/utilisateurs/${encodeURIComponent(m.member.username)}`}>
                      <Who
                        avatar={<Avatar name={m.member.displayName} size={32} />}
                        name={m.member.displayName}
                        sub={m.owner ? t('projects.detail.owner') : (m.roleTitle ?? undefined)}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title={t('projects.detail.roles')} />
            {project.roles.length === 0 ? (
              <EmptyState title={t('projects.detail.noRoles')} />
            ) : (
              <PanelBody>
                <ul className={styles.roles}>
                  {project.roles.map((role) => (
                    <li key={role.id}>
                      <div>
                        <b>{role.title}</b>
                        {role.member && (
                          <small className={cell.muted}>{role.member.displayName}</small>
                        )}
                      </div>
                      <Pill>
                        {role.status === 'OPEN'
                          ? t('projects.detail.roleOpen')
                          : t('projects.detail.roleFilled')}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </PanelBody>
            )}
          </Panel>

          <Panel>
            <PanelHead
              title={t('projects.detail.reports')}
              actions={
                <ButtonLink size="sm" to="/signalements">
                  {t('projects.detail.seeReports')}
                </ButtonLink>
              }
            />
            <QueryState
              query={reports}
              isEmpty={(d) => d.length === 0}
              empty={<EmptyState title={t('projects.detail.noReports')} />}
            >
              {(d) => (
                <PanelBody>
                  <ul className={styles.roles}>
                    {d.map((c) => (
                      <li key={c.id}>
                        <div>
                          <b>{c.reasons.map((r) => t(`reasons.${r.reason}`)).join(', ')}</b>
                          <small className={cell.muted}>
                            {t('reports.count', { count: c.reportCount })}
                          </small>
                        </div>
                        <Status tone={CASE_TONE[c.status]}>{t(`caseStatus.${c.status}`)}</Status>
                      </li>
                    ))}
                  </ul>
                </PanelBody>
              )}
            </QueryState>
            <PanelBody>
              <p className={styles.note}>{t('projects.detail.closedNote')}</p>
            </PanelBody>
          </Panel>
        </div>
      </Grid2>
    </>
  )
}
