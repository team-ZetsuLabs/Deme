import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Button, { ButtonLink } from '../../components/Button'
import { cell, TableWrap, Who } from '../../components/DataTable'
import { inputClass } from '../../components/Field'
import Icon from '../../components/Icon'
import { PageHead, Panel, PanelHead } from '../../components/Panel'
import { Status } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { formatAgo, formatDate } from '../../features/admin/format'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

const STATUS_TONE = { ongoing: 'good', upcoming: 'warn', finished: 'neutral' } as const
const SUBMISSION_TONE = { toGrade: 'warn', validated: 'good', rejected: 'crit' } as const

export default function ChallengesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { challenges, submissions, userBy, gradeSubmission, rejectSubmission } = useAdminStore()
  const notify = useToast()
  const [scores, setScores] = useState<Record<number, string>>({})
  const [invalid, setInvalid] = useState<number | null>(null)
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.challenges') },
  ])

  const current = challenges.find((c) => c.status === 'ongoing')

  function grade(id: number, userName: string) {
    const raw = scores[id] ?? ''
    const value = Number(raw)
    if (raw === '' || !Number.isFinite(value) || value < 0 || value > 100) {
      setInvalid(id)
      notify(t('challenges.scoreError'))
      return
    }
    setInvalid(null)
    gradeSubmission(id, value)
    notify(t('challenges.graded', { name: userName }))
  }

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
        <TableWrap>
          <thead>
            <tr>
              <th>{t('challenges.col.challenge')}</th>
              <th>{t('challenges.col.status')}</th>
              <th className={cell.hideSm}>{t('challenges.col.period')}</th>
              <th className={cell.num}>{t('challenges.col.submissions')}</th>
              <th className={`${cell.num} ${cell.hideSm}`}>{t('challenges.col.points')}</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className={cell.title}>{c.title}</span>
                </td>
                <td>
                  <Status tone={STATUS_TONE[c.status]}>{t(`challenges.status.${c.status}`)}</Status>
                </td>
                <td className={`${cell.hideSm} ${cell.muted}`}>
                  {t('challenges.period', {
                    from: formatDate(c.start, lang),
                    to: formatDate(c.end, lang),
                  })}
                </td>
                <td className={cell.num}>{c.submissions}</td>
                <td className={`${cell.num} ${cell.hideSm}`}>+{c.points}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      {current && (
        <Panel>
          <PanelHead title={t('challenges.submissionsTitle')} description={current.title} />
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
              {submissions.map((s) => {
                const user = userBy(s.user)
                const name = user?.name ?? s.user
                const href = safeHttpUrl(`https://github.com/${s.repo}`)
                return (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/utilisateurs/${s.user}`}>
                        <Who avatar={<Avatar name={name} size={28} />} name={name} />
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
                          {s.repo}
                        </a>
                      ) : (
                        s.repo
                      )}
                    </td>
                    <td className={`${cell.hideSm} ${cell.muted}`}>{formatAgo(s.at, lang)}</td>
                    <td>
                      <Status tone={SUBMISSION_TONE[s.status]}>
                        {t(`challenges.submission.${s.status}`)}
                      </Status>
                    </td>
                    <td>
                      <div className={cell.rowActions}>
                        {s.status === 'toGrade' ? (
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
                            <Button size="sm" variant="primary" onClick={() => grade(s.id, name)}>
                              {t('challenges.validate')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                rejectSubmission(s.id)
                                notify(t('challenges.rejectedToast'))
                              }}
                            >
                              {t('challenges.reject')}
                            </Button>
                          </>
                        ) : s.score !== undefined ? (
                          <span className={cell.mono}>{s.score}/100</span>
                        ) : (
                          <span className={cell.muted} style={{ fontSize: 13 }}>
                            {s.note ? t(`challenges.note.${s.note}`) : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  )
}
