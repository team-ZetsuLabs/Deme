import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { adminApi, playtestApi, publicApi } from '../../api/endpoints'
import { useQuery } from '../../api/useQuery'
import { ButtonLink } from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import { EmptyState, Grid2, PageHead, Panel, PanelBody, PanelHead } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { fmt, formatAgo, formatDate } from '../../features/admin/format'
import { useCrumbs } from '../../layout/crumbs'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  useCrumbs([{ label: t('nav.dashboard') }])

  const accounts = useQuery((signal) => adminApi.listUsers({ size: 1 }, { signal }), [])
  const cases = useQuery(
    (signal) => adminApi.listCases({ status: 'OPEN', size: 20 }, { signal }),
    [],
  )
  const appeals = useQuery(
    (signal) => adminApi.listCases({ status: 'APPEALED', size: 1 }, { signal }),
    [],
  )
  const jobs = useQuery(
    (signal) => adminApi.listJobs({ status: 'PENDING', size: 1 }, { signal }),
    [],
  )
  const proposals = useQuery(
    (signal) => adminApi.listProposals({ status: 'PENDING', size: 1 }, { signal }),
    [],
  )
  const tags = useQuery((signal) => adminApi.listTags({ size: 50 }, { signal }), [])
  const toGrade = useQuery(async (signal) => {
    const open = await adminApi.listChallenges({ status: 'OPEN', size: 1 }, { signal })
    const challenge = open.items[0]
    if (!challenge) return 0
    const page = await adminApi.listSubmissions(
      challenge.id,
      { status: 'PENDING', size: 1 },
      { signal },
    )
    return page.total
  }, [])

  const stats = useQuery((signal) => publicApi.stats({ signal }), [])
  const playtests = useQuery((signal) => playtestApi.stats({ signal }), [])

  const topTags = useMemo(
    () =>
      [...(tags.data?.items ?? [])].sort((a, b) => b.questionCount - a.questionCount).slice(0, 6),
    [tags.data],
  )
  const maxTag = Math.max(1, ...topTags.map((x) => x.questionCount))
  const topCases = useMemo(
    () => [...(cases.data?.items ?? [])].sort((a, b) => b.reportCount - a.reportCount).slice(0, 4),
    [cases.data],
  )
  const value = (n: number | undefined) => (n === undefined ? '…' : fmt(n, lang))

  return (
    <>
      <PageHead
        title={t('nav.dashboard')}
        description={t('dashboard.lead', {
          date: formatDate(new Date(), lang, { day: 'numeric', month: 'long', year: 'numeric' }),
        })}
      />

      <Panel className={styles.kpis} aria-label={t('dashboard.kpis')}>
        <Kpi
          label={t('dashboard.accounts')}
          value={value(accounts.data?.total)}
          hint={t('dashboard.accountsHint')}
        />
        <Kpi
          label={t('dashboard.reports')}
          value={value(cases.data?.total)}
          hint={t('dashboard.reportsHint')}
        />
        <Kpi
          label={t('dashboard.jobs')}
          value={value(jobs.data?.total)}
          hint={t('dashboard.jobsHint')}
        />
        <Kpi
          label={t('dashboard.submissions')}
          value={value(toGrade.data)}
          hint={t('dashboard.submissionsHint')}
        />
      </Panel>

      <Panel className={styles.kpis} aria-label={t('dashboard.communityKpis')}>
        <Kpi
          label={t('dashboard.questionsTotal')}
          value={value(stats.data?.questions)}
          hint={t('dashboard.questionsHint')}
        />
        <Kpi
          label={t('dashboard.answersTotal')}
          value={value(stats.data?.answers)}
          hint={t('dashboard.answersHint')}
        />
        <Kpi
          label={t('dashboard.solvedRate')}
          value={stats.data ? `${Math.round(stats.data.solvedRate * 100)} %` : '…'}
          hint={t('dashboard.solvedHint')}
        />
        <Kpi
          label={t('dashboard.members')}
          value={value(stats.data?.members)}
          hint={t('dashboard.membersHint', {
            countries: stats.data?.countries ?? 0,
            referents: stats.data?.levels.REFERENT ?? 0,
          })}
        />
      </Panel>

      <Grid2>
        <Panel aria-labelledby="recTitle">
          <PanelHead
            titleId="recTitle"
            title={t('dashboard.toHandle')}
            description={t('dashboard.mostReported')}
            actions={
              <ButtonLink size="sm" to="/signalements">
                {t('dashboard.seeAll')}
              </ButtonLink>
            }
          />
          <QueryState
            query={cases}
            isEmpty={() => topCases.length === 0}
            empty={
              <EmptyState title={t('reports.emptyTitle')}>{t('reports.emptyHint')}</EmptyState>
            }
          >
            {() => (
              <TableWrap>
                <thead>
                  <tr>
                    <th>{t('dashboard.colContent')}</th>
                    <th>{t('dashboard.colReason')}</th>
                    <th className={cell.num}>{t('dashboard.colReports')}</th>
                    <th className={`${cell.right} ${cell.hideSm}`}>{t('dashboard.colReceived')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topCases.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link className={cell.title} to="/signalements">
                          {t('dashboard.typeBy', {
                            type: t(`targets.${c.target.type}`),
                            name: c.target.author.displayName,
                          })}
                        </Link>
                      </td>
                      <td>{c.reasons[0] ? t(`reasons.${c.reasons[0].reason}`) : ''}</td>
                      <td className={cell.num}>{c.reportCount}</td>
                      <td className={`${cell.right} ${cell.muted} ${cell.hideSm}`}>
                        {formatAgo(c.firstReportedAt, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </QueryState>
        </Panel>

        <Panel aria-labelledby="todoTitle">
          <PanelHead
            titleId="todoTitle"
            title={t('dashboard.toValidate')}
            description={t('dashboard.toValidateLead')}
          />
          <PanelBody className={styles.todoBody}>
            <ul className={styles.todo}>
              <li>
                <time>{t('nav.jobs')}</time>
                <span>
                  <Link to="/offres">
                    {t('dashboard.pendingJobs', { count: jobs.data?.total ?? 0 })}
                  </Link>{' '}
                  {t('dashboard.pendingJobsEnd')}
                </span>
              </li>
              <li>
                <time>{t('nav.challenges')}</time>
                <span>
                  <Link to="/challenges">
                    {t('dashboard.toGrade', { count: toGrade.data ?? 0 })}
                  </Link>{' '}
                  {t('dashboard.toGradeEnd')}
                </span>
              </li>
              <li>
                <time>{t('nav.reports')}</time>
                <span>
                  <Link to="/signalements">
                    {t('dashboard.appeals', { count: appeals.data?.total ?? 0 })}
                  </Link>{' '}
                  {t('dashboard.appealsEnd')}
                </span>
              </li>
              <li>
                <time>{t('nav.playtests')}</time>
                <span>
                  <Link to="/tests?status=PENDING_REVIEW">
                    {t('dashboard.playtests', { count: playtests.data?.pendingReview ?? 0 })}
                  </Link>{' '}
                  {t('dashboard.playtestsEnd')}
                </span>
              </li>
              <li>
                <time>{t('nav.communities')}</time>
                <span>
                  <Link to="/communautes">
                    {t('dashboard.proposals', { count: proposals.data?.total ?? 0 })}
                  </Link>{' '}
                  {t('dashboard.proposalsEnd')}
                </span>
              </li>
            </ul>
          </PanelBody>
        </Panel>
      </Grid2>

      <Panel aria-labelledby="tagTitle" style={{ marginTop: 24 }}>
        <PanelHead
          titleId="tagTitle"
          title={t('dashboard.tagsTitle')}
          description={t('dashboard.tagsLead')}
        />
        <QueryState
          query={tags}
          isEmpty={() => topTags.length === 0}
          empty={<EmptyState title={t('tags.emptyTitle')} />}
        >
          {() => (
            <PanelBody>
              <div className={styles.bars}>
                {topTags.map((tag) => (
                  <div
                    key={tag.name}
                    className={styles.barRow}
                    tabIndex={0}
                    aria-label={`${tag.name} : ${t('dashboard.barTip', { count: tag.questionCount })}`}
                  >
                    <span className={styles.barLabel}>{tag.name}</span>
                    <span className={styles.barTrack}>
                      <span
                        className={styles.barFill}
                        style={{ width: `${((tag.questionCount / maxTag) * 100).toFixed(1)}%` }}
                      />
                    </span>
                    <span className={styles.barValue}>{fmt(tag.questionCount, lang)}</span>
                  </div>
                ))}
              </div>
            </PanelBody>
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
      <div className={styles.kDelta}>{hint}</div>
    </div>
  )
}
