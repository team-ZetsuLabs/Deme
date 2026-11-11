import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { playtestApi } from '../../api/endpoints'
import type { PlaytestStatus } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { cell, Pager, TableWrap, Who } from '../../components/DataTable'
import { compactSelectClass, selectClass } from '../../components/Field'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Pill, Status } from '../../components/Status'
import { fmt, formatAgo } from '../../features/admin/format'
import AppIcon from '../../features/playtests/AppIcon'
import { PLAYTEST_TONE } from '../../features/playtests/tones'
import { useCrumbs } from '../../layout/crumbs'
import styles from './PlaytestsPage.module.css'
import utils from '../../styles/utils.module.css'

const PAGE_SIZE = 20
const STATUSES: PlaytestStatus[] = [
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
  'COMPLETED',
]
const PROBLEMS = ['INACTIVE', 'STALLED', 'REPORTED'] as const

export default function PlaytestsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [params, setParams] = useSearchParams()
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.playtests') },
  ])

  const status = (params.get('status') as PlaytestStatus | null) ?? undefined
  const problem = (params.get('problem') as (typeof PROBLEMS)[number] | null) ?? undefined
  const page = Math.max(1, Number(params.get('page')) || 1)

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const stats = useQuery((signal) => playtestApi.stats({ signal }), [])
  const query = useQuery(
    (signal) => playtestApi.list({ status, problem, page: page - 1, size: PAGE_SIZE }, { signal }),
    [status, problem, page],
  )
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1
  const s = stats.data
  const value = (n: number | undefined) => (n === undefined ? '…' : fmt(n, lang))

  return (
    <>
      <PageHead title={t('nav.playtests')} description={t('playtests.lead')} />

      <Panel className={styles.kpis} aria-label={t('playtests.kpis')}>
        <Kpi
          label={t('playtests.stats.pending')}
          value={value(s?.pendingReview)}
          hint={t('playtests.stats.pendingHint')}
        />
        <Kpi
          label={t('playtests.stats.active')}
          value={value(s?.active)}
          hint={t('playtests.stats.activeHint', { total: s?.campaigns ?? 0 })}
        />
        <Kpi
          label={t('playtests.stats.testers')}
          value={value(s?.testers)}
          hint={t('playtests.stats.testersHint', { owners: s?.owners ?? 0 })}
        />
        <Kpi
          label={t('playtests.stats.running')}
          value={value(s?.participationsRunning)}
          hint={t('playtests.stats.runningHint', { done: s?.participationsCompleted ?? 0 })}
        />
      </Panel>

      <Filters>
        <Segmented<PlaytestStatus | 'ALL'>
          label={t('playtests.statusFilter')}
          value={status ?? 'ALL'}
          onChange={(next) => update({ status: next === 'ALL' ? null : next })}
          options={[
            { value: 'ALL', label: t('playtests.allStatuses') },
            ...STATUSES.map((x) => ({ value: x, label: t(`playtestStatus.${x}`) })),
          ]}
        />
      </Filters>
      <Filters>
        <label className={utils.srOnly} htmlFor="ptProblem">
          {t('playtests.problemFilter')}
        </label>
        <select
          id="ptProblem"
          className={`${selectClass} ${compactSelectClass}`}
          value={problem ?? ''}
          onChange={(event) => update({ problem: event.target.value || null })}
        >
          <option value="">{t('playtests.allProblems')}</option>
          {PROBLEMS.map((x) => (
            <option key={x} value={x}>
              {t(`playtests.problem.${x}`)}
            </option>
          ))}
        </select>
      </Filters>

      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState title={t('playtests.emptyTitle')}>{t('playtests.emptyHint')}</EmptyState>
          }
        >
          {(d) => (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <th>{t('playtests.col.app')}</th>
                    <th className={cell.hideSm}>{t('playtests.col.owner')}</th>
                    <th className={cell.hideSm}>{t('playtests.col.platform')}</th>
                    <th>{t('playtests.col.progress')}</th>
                    <th>{t('playtests.col.status')}</th>
                    <th className={`${cell.right} ${cell.hideSm}`}>{t('playtests.col.created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map(({ campaign, hidden, inactive, stalled }) => (
                    <tr key={campaign.id}>
                      <td>
                        <div className={styles.app}>
                          <AppIcon name={campaign.appName} iconUrl={campaign.iconUrl} />
                          <div>
                            <Link className={cell.title} to={`/tests/${campaign.id}`}>
                              {campaign.appName}
                            </Link>
                            <small className={cell.sub}>
                              {campaign.packageName ?? t('playtests.noPackage')}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className={cell.hideSm}>
                        <Link to={`/utilisateurs/${encodeURIComponent(campaign.owner.username)}`}>
                          <Who
                            avatar={<Avatar name={campaign.owner.displayName} size={28} />}
                            name={campaign.owner.displayName}
                          />
                        </Link>
                      </td>
                      <td className={cell.hideSm}>{t(`playtestPlatform.${campaign.platform}`)}</td>
                      <td>
                        <div
                          className={styles.progress}
                          role="img"
                          aria-label={`${campaign.progress.percent} %`}
                        >
                          <span style={{ width: `${campaign.progress.percent}%` }} />
                        </div>
                        <small className={cell.sub}>
                          {t('playtests.testersCount', {
                            count: campaign.testersTarget - campaign.spotsLeft,
                            target: campaign.testersTarget,
                          })}
                        </small>
                        {(hidden || inactive || stalled) && (
                          <div className={styles.flags}>
                            {hidden && <Pill>{t('playtests.problem.REPORTED')}</Pill>}
                            {inactive && <Pill>{t('playtests.problem.INACTIVE')}</Pill>}
                            {stalled && <Pill>{t('playtests.problem.STALLED')}</Pill>}
                          </div>
                        )}
                      </td>
                      <td>
                        <Status tone={PLAYTEST_TONE[campaign.status]}>
                          {t(`playtestStatus.${campaign.status}`)}
                        </Status>
                      </td>
                      <td className={`${cell.right} ${cell.muted} ${cell.hideSm}`}>
                        {formatAgo(campaign.createdAt, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              {pages > 1 && (
                <Pager summary={t('common.page', { page, pages })}>
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
              )}
            </>
          )}
        </QueryState>
      </Panel>
    </>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kLabel}>{label}</div>
      <div className={styles.kValue}>{value}</div>
      <div className={styles.kHint}>{hint}</div>
    </div>
  )
}
