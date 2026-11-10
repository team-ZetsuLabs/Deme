import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { publicApi } from '../../api/endpoints'
import type { ProjectStatus, ProjectType } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Button from '../../components/Button'
import { Pager } from '../../components/DataTable'
import { compactSelectClass, inputClass, selectClass } from '../../components/Field'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCrumbs } from '../../layout/crumbs'
import ProjectTable from '../../features/projects/ProjectTable'
import utils from '../../styles/utils.module.css'

const PAGE_SIZE = 20
const STATUSES: ProjectStatus[] = ['OPEN', 'IN_PROGRESS', 'PAUSED', 'CLOSED']
const TYPES: ProjectType[] = ['OPEN_SOURCE', 'STUDY', 'STARTUP', 'VOLUNTEER']

export default function ProjectsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.projects') },
  ])

  const status = (params.get('status') as ProjectStatus | null) ?? undefined
  const type = (params.get('type') as ProjectType | null) ?? undefined
  const technology = params.get('technology') ?? ''
  const openRoles = params.get('openRoles') === '1'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const debouncedTech = useDebouncedValue(technology)

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const query = useQuery(
    (signal) =>
      publicApi.listProjects(
        {
          status,
          type,
          technology: debouncedTech.trim().toLowerCase() || undefined,
          openRoles: openRoles || undefined,
          page: page - 1,
          size: PAGE_SIZE,
        },
        { signal },
      ),
    [status, type, debouncedTech, openRoles, page],
  )

  const statusOptions = [
    { value: 'ALL' as const, label: t('projects.allStatuses') },
    ...STATUSES.map((s) => ({ value: s, label: t(`projectStatus.${s}`) })),
  ]
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1

  return (
    <>
      <PageHead title={t('nav.projects')} description={t('projects.lead')} />
      <Filters>
        <Segmented<ProjectStatus | 'ALL'>
          label={t('projects.statusFilter')}
          options={statusOptions}
          value={status ?? 'ALL'}
          onChange={(next) => update({ status: next === 'ALL' ? null : next })}
        />
      </Filters>
      <Filters>
        <label className={utils.srOnly} htmlFor="pjTech">
          {t('projects.technology')}
        </label>
        <input
          id="pjTech"
          type="search"
          className={inputClass}
          style={{ width: 260, minHeight: 36, fontSize: 14 }}
          placeholder={t('projects.searchPlaceholder')}
          value={technology}
          onChange={(event) => update({ technology: event.target.value || null })}
        />
        <label className={utils.srOnly} htmlFor="pjType">
          {t('projects.typeFilter')}
        </label>
        <select
          id="pjType"
          className={`${selectClass} ${compactSelectClass}`}
          value={type ?? ''}
          onChange={(event) => update({ type: event.target.value || null })}
        >
          <option value="">{t('projects.allTypes')}</option>
          {TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`projectType.${x}`)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={openRoles ? 'primary' : 'secondary'}
          aria-pressed={openRoles}
          onClick={() => update({ openRoles: openRoles ? null : '1' })}
        >
          {t('projects.openRolesOnly')}
        </Button>
      </Filters>
      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState title={t('projects.emptyTitle')}>{t('projects.emptyHint')}</EmptyState>
          }
        >
          {(d) => (
            <>
              <ProjectTable items={d.items} />
              <Pager
                summary={t('projects.range', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, d.total),
                  total: d.total,
                })}
              >
                <Button
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => update({ page: String(page - 1) })}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => update({ page: String(page + 1) })}
                >
                  {t('common.next')}
                </Button>
              </Pager>
            </>
          )}
        </QueryState>
      </Panel>
    </>
  )
}
