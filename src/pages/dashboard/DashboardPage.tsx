import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Button, { ButtonLink } from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import { compactSelectClass, selectClass } from '../../components/Field'
import {
  EmptyState,
  Filters,
  Grid2,
  PageHead,
  Panel,
  PanelBody,
  PanelHead,
} from '../../components/Panel'
import Segmented from '../../components/Segmented'
import { useAdminStore } from '../../features/admin/AdminStore'
import {
  DAILY_ANSWERS,
  DAILY_QUESTIONS,
  DAILY_SIGNUPS,
  TAG_SHARE,
} from '../../features/admin/demoData'
import { fmt, formatAgo, formatDate } from '../../features/admin/format'
import LineChart from '../../features/dashboard/LineChart'
import { useCrumbs } from '../../layout/crumbs'
import styles from './DashboardPage.module.css'
import utils from '../../styles/utils.module.css'

type Range = 7 | 30 | 90

const COUNTRY_SHARE: Record<string, number> = {
  'Burkina Faso': 0.24,
  Sénégal: 0.18,
  "Côte d'Ivoire": 0.16,
  Ghana: 0.12,
  Kenya: 0.1,
  Maroc: 0.08,
}
const COUNTRIES = Object.keys(COUNTRY_SHARE)
const RESOLVED = { 7: [68, 63], 30: [64, 61], 90: [61, 58] } as const
const MEDIAN = { 7: [38, 45], 30: [44, 49], 90: [51, 56] } as const

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0)
const windowSlice = (values: number[], days: number, offset = 0) =>
  values.slice(values.length - days - offset, values.length - offset)

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { reports, pendingJobs, submissions, users, userBy } = useAdminStore()
  const [range, setRange] = useState<Range>(30)
  const [country, setCountry] = useState('all')
  const [tableView, setTableView] = useState(false)
  useCrumbs([{ label: t('nav.dashboard') }])

  const factor = country === 'all' ? 1 : (COUNTRY_SHARE[country] ?? 0.05)
  const today = useMemo(() => new Date(), [])

  const data = useMemo(() => {
    const questions = windowSlice(DAILY_QUESTIONS, range).map((v) => Math.round(v * factor))
    const answers = windowSlice(DAILY_ANSWERS, range).map((v) => Math.round(v * factor))
    const dates = questions.map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (range - 1 - i))
      return d
    })
    const half = Math.min(range, 45)
    const previous = (series: number[]) =>
      Math.round(sum(windowSlice(series, half, half)) * factor * (range / half))
    return {
      questions,
      answers,
      dates,
      signups: Math.round(sum(windowSlice(DAILY_SIGNUPS, range)) * factor),
      signupsPrev: previous(DAILY_SIGNUPS),
      questionsTotal: Math.round(sum(windowSlice(DAILY_QUESTIONS, range)) * factor),
      questionsPrev: previous(DAILY_QUESTIONS),
    }
  }, [range, factor, today])

  const delta = (current: number, prev: number, goodWhenUp = true) => {
    if (!prev) return null
    const pct = Math.round(((current - prev) / prev) * 100)
    const good = goodWhenUp ? pct >= 0 : pct <= 0
    return (
      <>
        <b className={good ? styles.up : styles.down}>
          {pct >= 0 ? '+' : ''}
          {pct} %
        </b>{' '}
        {t('dashboard.vsPrevious', { count: range })}
      </>
    )
  }

  const [resolved, resolvedPrev] = RESOLVED[range]
  const [median, medianPrev] = MEDIAN[range]
  const questionsTotal = sum(data.questions)
  const bars = Object.entries(TAG_SHARE).map(
    ([tag, share]) => [tag, Math.round(questionsTotal * share)] as const,
  )
  const maxBar = Math.max(...bars.map(([, v]) => v))
  const toGrade = submissions.filter((s) => s.status === 'toGrade').length
  const flagged = users.filter((u) => u.status === 'flagged').length
  const topReports = [...reports].sort((a, b) => b.count - a.count).slice(0, 4)

  const rangeOptions = ([7, 30, 90] as const).map((d) => ({
    value: String(d) as `${Range}`,
    label: t('dashboard.lastDays', { count: d }),
  }))

  return (
    <>
      <PageHead
        title={t('nav.dashboard')}
        description={t('dashboard.lead', {
          date: formatDate(today, lang, { day: 'numeric', month: 'long', year: 'numeric' }),
        })}
      />
      <Filters>
        <Segmented<`${Range}`>
          label={t('dashboard.period')}
          options={rangeOptions}
          value={String(range) as `${Range}`}
          onChange={(value) => setRange(Number(value) as Range)}
        />
        <label className={utils.srOnly} htmlFor="countrySel">
          {t('dashboard.country')}
        </label>
        <select
          id="countrySel"
          className={`${selectClass} ${compactSelectClass}`}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        >
          <option value="all">{t('dashboard.allCountries')}</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Filters>

      <Panel className={styles.kpis} aria-label={t('dashboard.kpis')}>
        <Kpi
          label={t('dashboard.signups')}
          value={fmt(data.signups, lang)}
          delta={delta(data.signups, data.signupsPrev)}
        />
        <Kpi
          label={t('dashboard.questions')}
          value={fmt(data.questionsTotal, lang)}
          delta={delta(data.questionsTotal, data.questionsPrev)}
        />
        <Kpi
          label={t('dashboard.resolved')}
          value={`${resolved} %`}
          delta={delta(resolved, resolvedPrev)}
        />
        <Kpi
          label={t('dashboard.median')}
          value={`${median} min`}
          delta={delta(median, medianPrev, false)}
        />
      </Panel>

      <Grid2>
        <Panel aria-labelledby="actTitle">
          <PanelHead
            titleId="actTitle"
            title={t('dashboard.activityTitle')}
            description={
              country === 'all'
                ? t('dashboard.lastDays', { count: range })
                : `${t('dashboard.lastDays', { count: range })}, ${country}`
            }
            actions={
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={tableView}
                onClick={() => setTableView((v) => !v)}
              >
                {tableView ? t('dashboard.showChart') : t('dashboard.showData')}
              </Button>
            }
          />
          <PanelBody>
            <div className={styles.legend}>
              <span>
                <i style={{ background: 'var(--series-1)' }} />
                {t('dashboard.answers')}
              </span>
              <span>
                <i style={{ background: 'var(--series-2)' }} />
                {t('dashboard.questionsSeries')}
              </span>
            </div>
            {tableView ? (
              <TableWrap maxHeight={300}>
                <thead>
                  <tr>
                    <th>{t('dashboard.day')}</th>
                    <th className={cell.num}>{t('dashboard.questionsSeries')}</th>
                    <th className={cell.num}>{t('dashboard.answers')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dates
                    .map((d, i) => (
                      <tr key={d.toISOString()}>
                        <td>{formatDate(d, lang, { day: 'numeric', month: 'short' })}</td>
                        <td className={cell.num}>{data.questions[i]}</td>
                        <td className={cell.num}>{data.answers[i]}</td>
                      </tr>
                    ))
                    .reverse()}
                </tbody>
              </TableWrap>
            ) : (
              <LineChart
                dates={data.dates}
                label={t('dashboard.chartLabel')}
                series={[
                  { name: t('dashboard.answers'), color: 'var(--series-1)', values: data.answers },
                  {
                    name: t('dashboard.questionsSeries'),
                    color: 'var(--series-2)',
                    values: data.questions,
                  },
                ]}
              />
            )}
          </PanelBody>
        </Panel>

        <Panel aria-labelledby="tagTitle">
          <PanelHead
            titleId="tagTitle"
            title={t('dashboard.tagsTitle')}
            description={t('dashboard.tagsLead')}
          />
          <PanelBody>
            <div className={styles.bars}>
              {bars.map(([tag, value]) => (
                <div
                  key={tag}
                  className={styles.barRow}
                  tabIndex={0}
                  title={t('dashboard.barTip', {
                    count: value,
                    pct: Math.round((value / questionsTotal) * 100),
                  })}
                  aria-label={`${tag} : ${t('dashboard.barTip', { count: value, pct: Math.round((value / questionsTotal) * 100) })}`}
                >
                  <span className={styles.barLabel}>{tag}</span>
                  <span className={styles.barTrack}>
                    <span
                      className={styles.barFill}
                      style={{ width: `${((value / maxBar) * 100).toFixed(1)}%` }}
                    />
                  </span>
                  <span className={styles.barValue}>{fmt(value, lang)}</span>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      </Grid2>

      <Grid2 className={styles.second}>
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
          {topReports.length ? (
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
                {topReports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link className={cell.title} to={`/signalements?open=${r.id}`}>
                        {t('dashboard.typeBy', {
                          type: t(`reports.types.${r.type}`),
                          name: userBy(r.author)?.name ?? r.author,
                        })}
                      </Link>
                    </td>
                    <td>{t(`reports.reason.${r.reason}`)}</td>
                    <td className={cell.num}>{r.count}</td>
                    <td className={`${cell.right} ${cell.muted} ${cell.hideSm}`}>
                      {formatAgo(r.at, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : (
            <EmptyState title={t('reports.emptyAll')}>{t('reports.emptyAllHint')}</EmptyState>
          )}
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
                    {t('dashboard.pendingJobs', { count: pendingJobs.length })}
                  </Link>{' '}
                  {t('dashboard.pendingJobsEnd')}
                </span>
              </li>
              <li>
                <time>{t('nav.challenges')}</time>
                <span>
                  <Link to="/challenges">{t('dashboard.toGrade', { count: toGrade })}</Link>{' '}
                  {t('dashboard.toGradeEnd')}
                </span>
              </li>
              <li>
                <time>{t('dashboard.accounts')}</time>
                <span>
                  <Link to="/utilisateurs?status=flagged">
                    {t('dashboard.flagged', { count: flagged })}
                  </Link>{' '}
                  {t('dashboard.flaggedEnd')}
                </span>
              </li>
            </ul>
          </PanelBody>
        </Panel>
      </Grid2>
    </>
  )
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: React.ReactNode }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kLabel}>{label}</div>
      <div className={styles.kValue}>{value}</div>
      <div className={styles.kDelta}>{delta}</div>
    </div>
  )
}
