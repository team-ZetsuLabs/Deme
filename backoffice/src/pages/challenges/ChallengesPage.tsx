import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { AdminSubmission, Challenge } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button, { ButtonLink } from '../../components/Button'
import { cell, TableWrap, Who } from '../../components/DataTable'
import { compactSelectClass, inputClass, selectClass } from '../../components/Field'
import Icon from '../../components/Icon'
import { EmptyState, Filters, PageHead, Panel, PanelHead } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { formatAgo, formatDate } from '../../features/admin/format'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import { useCounts } from '../../layout/counts'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

type SubmissionTab = 'PENDING' | 'VALIDATED' | 'REJECTED'
const CHALLENGE_TONE = { OPEN: 'good', UPCOMING: 'warn', CLOSED: 'neutral' } as const
const SUBMISSION_TONE = { PENDING: 'warn', VALIDATED: 'good', REJECTED: 'crit' } as const

export default function ChallengesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [chosenId, setChosenId] = useState<number | null>(null)
  const [tab, setTab] = useState<SubmissionTab>('PENDING')
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.challenges') },
  ])

  const challenges = useQuery((signal) => adminApi.listChallenges({ size: 50 }, { signal }), [])
  const list = challenges.data?.items
  const current: Challenge | undefined =
    list?.find((c) => c.id === chosenId) ?? list?.find((c) => c.status === 'OPEN') ?? list?.[0]

  const tabOptions = (['PENDING', 'VALIDATED', 'REJECTED'] as const).map((value) => ({
    value,
    label: t(`submissionStatus.${value}`),
  }))

  return (
    <>
      <PageHead
        title={t('nav.challenges')}
        description={t('challenges.lead')}
        actions={
          <ButtonLink variant="primary" to="/challenges/nouveau">
            <Icon name="plus" size={13} />
            {t('challenges.create')}
          </ButtonLink>
        }
      />
      <Panel style={{ marginBottom: 24 }}>
        <QueryState
          query={challenges}
          isEmpty={(d) => d.items.length === 0}
          empty={
            <EmptyState title={t('challenges.noneTitle')}>{t('challenges.noneHint')}</EmptyState>
          }
        >
          {(d) => (
            <TableWrap>
              <thead>
                <tr>
                  <th>{t('challenges.col.challenge')}</th>
                  <th>{t('challenges.col.status')}</th>
                  <th className={cell.hideSm}>{t('challenges.col.period')}</th>
                  <th className={cell.num}>{t('challenges.col.submissions')}</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className={cell.title}>{c.title}</span>
                    </td>
                    <td>
                      <Status tone={CHALLENGE_TONE[c.status]}>
                        {t(`challengeStatus.${c.status}`)}
                      </Status>
                    </td>
                    <td className={`${cell.hideSm} ${cell.muted}`}>
                      {t('challenges.period', {
                        from: formatDate(c.startsAt, lang),
                        to: formatDate(c.endsAt, lang),
                      })}
                    </td>
                    <td className={cell.num}>{c.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </QueryState>
      </Panel>

      {current && list && (
        <Submissions
          challenge={current}
          challenges={list}
          tab={tab}
          tabOptions={tabOptions}
          onTab={setTab}
          onChallenge={setChosenId}
        />
      )}
    </>
  )
}

function Submissions({
  challenge,
  challenges,
  tab,
  tabOptions,
  onTab,
  onChallenge,
}: {
  challenge: Challenge
  challenges: Challenge[]
  tab: SubmissionTab
  tabOptions: { value: SubmissionTab; label: string }[]
  onTab: (tab: SubmissionTab) => void
  onChallenge: (id: number) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const counts = useCounts()
  const [scores, setScores] = useState<Record<number, string>>({})
  const [invalid, setInvalid] = useState<number | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const query = useQuery(
    (signal) => adminApi.listSubmissions(challenge.id, { status: tab, size: 50 }, { signal }),
    [challenge.id, tab],
  )

  async function review(item: AdminSubmission, status: 'VALIDATED' | 'REJECTED') {
    const raw = scores[item.id] ?? ''
    const score = status === 'REJECTED' ? 0 : Number(raw)
    if (
      status === 'VALIDATED' &&
      (raw === '' || !Number.isInteger(score) || score < 0 || score > 100)
    ) {
      setInvalid(item.id)
      notify(t('challenges.scoreError'))
      return
    }
    setInvalid(null)
    setBusy(item.id)
    try {
      await adminApi.reviewSubmission(item.id, status, score)
      notify(
        status === 'VALIDATED'
          ? t('challenges.graded', { name: item.member.displayName })
          : t('challenges.rejectedToast'),
      )
      query.reload()
      counts.refresh()
    } catch (error) {
      notify(errorMessage(t, error))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Panel>
      <PanelHead title={t('challenges.submissionsTitle')} description={challenge.title} />
      <div style={{ padding: '12px 24px 0' }}>
        <Filters>
          <label className={utils.srOnly} htmlFor="chPick">
            {t('challenges.pick')}
          </label>
          <select
            id="chPick"
            className={`${selectClass} ${compactSelectClass}`}
            value={challenge.id}
            onChange={(event) => onChallenge(Number(event.target.value))}
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <Segmented<SubmissionTab>
            label={t('challenges.submissionStatus')}
            options={tabOptions}
            value={tab}
            onChange={onTab}
          />
        </Filters>
      </div>
      <QueryState
        query={query}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title={t('challenges.noSubmissions')} />}
      >
        {(d) => (
          <TableWrap>
            <thead>
              <tr>
                <th>{t('challenges.col.participant')}</th>
                <th className={cell.hideSm}>{t('challenges.col.repo')}</th>
                <th className={cell.hideSm}>{t('challenges.col.received')}</th>
                <th>{t('challenges.col.status')}</th>
                <th className={cell.right}>{t('challenges.col.evaluation')}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((s) => {
                const href = safeHttpUrl(s.repositoryUrl)
                return (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/utilisateurs?q=${encodeURIComponent(s.member.username)}`}>
                        <Who
                          avatar={<Avatar name={s.member.displayName} size={28} />}
                          name={s.member.displayName}
                        />
                      </Link>
                    </td>
                    <td className={cell.hideSm}>
                      {href ? (
                        <a
                          className={cell.mono}
                          style={{ fontSize: 13 }}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.repositoryUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span>{t('challenges.invalidLink')}</span>
                      )}
                    </td>
                    <td className={`${cell.hideSm} ${cell.muted}`}>
                      {formatAgo(s.submittedAt, lang)}
                    </td>
                    <td>
                      <Status tone={SUBMISSION_TONE[s.status]}>
                        {t(`submissionStatus.${s.status}`)}
                      </Status>
                    </td>
                    <td>
                      <div className={cell.rowActions}>
                        {s.status === 'PENDING' ? (
                          <>
                            <label className={utils.srOnly} htmlFor={`score-${s.id}`}>
                              {t('challenges.scoreLabel')}
                            </label>
                            <input
                              id={`score-${s.id}`}
                              className={inputClass}
                              type="number"
                              min={0}
                              max={100}
                              placeholder="/100"
                              aria-invalid={invalid === s.id ? true : undefined}
                              style={{ width: 80, minHeight: 30, fontSize: 13 }}
                              value={scores[s.id] ?? ''}
                              onChange={(event) =>
                                setScores((v) => ({ ...v, [s.id]: event.target.value }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              busy={busy === s.id}
                              onClick={() => review(s, 'VALIDATED')}
                            >
                              {t('challenges.validate')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy === s.id}
                              onClick={() => review(s, 'REJECTED')}
                            >
                              {t('challenges.reject')}
                            </Button>
                          </>
                        ) : s.status === 'VALIDATED' ? (
                          <span className={cell.mono}>{s.score}/100</span>
                        ) : (
                          <span className={cell.muted} style={{ fontSize: 13 }}>
                            {s.feedback ?? ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </QueryState>
    </Panel>
  )
}
