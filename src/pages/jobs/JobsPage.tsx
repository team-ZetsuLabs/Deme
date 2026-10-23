import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import Segmented from '../../components/Segmented'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { daysAgoToTime, formatAgo, formatDayMonth } from '../../features/admin/format'
import type { PendingJob } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'
import styles from './JobsPage.module.css'
import utils from '../../styles/utils.module.css'

type Tab = 'pending' | 'published' | 'refused'
const PRESETS = ['vague', 'unverifiable', 'notDev', 'abusivePay'] as const
const MIN_REASON = 15

export default function JobsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { pendingJobs, publishedJobs, refusedJobs, approveJob, refuseJob } = useAdminStore()
  const notify = useToast()
  const [tab, setTab] = useState<Tab>('pending')
  const [refusing, setRefusing] = useState<PendingJob | null>(null)
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const [approving, setApproving] = useState<number | null>(null)
  useCrumbs([{ label: t('shell.groups.community'), to: '/utilisateurs' }, { label: t('nav.jobs') }])

  async function approve(job: PendingJob) {
    setApproving(job.id)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setApproving(null)
    approveJob(job.id)
    notify(t('jobs.published', { company: job.company }))
  }

  function openRefuse(job: PendingJob) {
    setRefusing(job)
    setReason('')
    setTouched(false)
  }

  function submitRefusal(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!refusing || reason.trim().length < MIN_REASON) return
    refuseJob(refusing.id, reason.trim())
    notify(t('jobs.refusedToast', { company: refusing.company }))
    setRefusing(null)
  }

  const options = [
    { value: 'pending' as Tab, label: t('jobs.tab.pending'), count: pendingJobs.length },
    { value: 'published' as Tab, label: t('jobs.tab.published'), count: publishedJobs.length },
    { value: 'refused' as Tab, label: t('jobs.tab.refused'), count: refusedJobs.length },
  ]
  const error =
    touched && reason.trim().length < MIN_REASON
      ? t('jobs.refuse.error', { count: MIN_REASON })
      : undefined

  return (
    <>
      <PageHead title={t('nav.jobs')} description={t('jobs.lead')} />
      <Filters>
        <Segmented<Tab>
          kind="tabs"
          label={t('jobs.statusLabel')}
          options={options}
          value={tab}
          onChange={setTab}
        />
      </Filters>
      <Panel>
        {tab === 'pending' &&
          (pendingJobs.length ? (
            pendingJobs.map((job) => (
              <article key={job.id} className={styles.card}>
                <Avatar name={job.company} size={48} square />
                <div>
                  <h2>{job.title}</h2>
                  <p className={styles.meta}>
                    {t('jobs.meta', {
                      company: job.company,
                      city: job.city ?? t('jobs.remote'),
                      type: t(`jobs.type.${job.type}`),
                      ago: formatAgo(job.at, lang),
                      by: job.by,
                    })}
                  </p>
                  <div className={styles.checks}>
                    {job.checks.map((check) => (
                      <span key={check.key} className={check.ok ? styles.ok : styles.ko}>
                        <Icon name={check.ok ? 'check' : 'x'} size={13} />
                        {t(`jobs.check.${check.key}`)}
                        <span className={utils.srOnly}>
                          {check.ok ? t('jobs.yes') : t('jobs.no')}
                        </span>
                      </span>
                    ))}
                  </div>
                  <details className={styles.details}>
                    <summary>{t('jobs.viewAd')}</summary>
                    <p>{job.about}</p>
                    <ul>
                      {job.missions.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </details>
                </div>
                <div className={styles.acts}>
                  <Button
                    variant="primary"
                    busy={approving === job.id}
                    onClick={() => approve(job)}
                  >
                    {approving === job.id ? t('jobs.publishing') : t('jobs.approve')}
                  </Button>
                  <Button variant="dangerLine" onClick={() => openRefuse(job)}>
                    {t('jobs.refuse.action')}
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title={t('jobs.nonePending')}>{t('jobs.nonePendingHint')}</EmptyState>
          ))}
        {tab === 'published' && (
          <TableWrap>
            <thead>
              <tr>
                <th>{t('jobs.col.offer')}</th>
                <th className={cell.hideSm}>{t('jobs.col.company')}</th>
                <th className={cell.num}>{t('jobs.col.applicants')}</th>
                <th className={cell.right}>{t('jobs.col.publishedOn')}</th>
              </tr>
            </thead>
            <tbody>
              {publishedJobs.map((job) => (
                <tr key={job.title}>
                  <td>
                    <span className={cell.title}>{job.title}</span>
                  </td>
                  <td className={cell.hideSm}>{job.company}</td>
                  <td className={cell.num}>{job.applicants}</td>
                  <td className={`${cell.right} ${cell.muted}`}>
                    {formatDayMonth(daysAgoToTime(job.daysAgo), lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {tab === 'refused' && (
          <TableWrap>
            <thead>
              <tr>
                <th>{t('jobs.col.offer')}</th>
                <th className={cell.hideSm}>{t('jobs.col.company')}</th>
                <th>{t('jobs.col.reason')}</th>
                <th className={cell.right}>{t('jobs.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {refusedJobs.map((job) => (
                <tr key={job.title}>
                  <td>
                    <span className={cell.title}>{job.title}</span>
                  </td>
                  <td className={cell.hideSm}>{job.company}</td>
                  <td>
                    {(PRESETS as readonly string[]).includes(job.reason)
                      ? t(`jobs.refuse.preset.${job.reason}`)
                      : job.reason}
                  </td>
                  <td className={`${cell.right} ${cell.muted}`}>
                    {formatDayMonth(daysAgoToTime(job.daysAgo), lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Dialog
        open={refusing !== null}
        title={t('jobs.refuse.title')}
        onClose={() => setRefusing(null)}
      >
        <DialogBody onSubmit={submitRefusal}>
          <DialogLead>{t('jobs.refuse.lead', { company: refusing?.company })}</DialogLead>
          <Field label={t('jobs.refuse.reasonLabel')} error={error}>
            {(control) => (
              <>
                <select
                  className={`${control.className}`}
                  aria-label={t('jobs.refuse.presetLabel')}
                  value=""
                  onChange={(event) => {
                    if (event.target.value)
                      setReason(`${t(`jobs.refuse.preset.${event.target.value}`)}. `)
                  }}
                  style={{ marginBottom: 8 }}
                >
                  <option value="">{t('jobs.refuse.choosePreset')}</option>
                  {PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {t(`jobs.refuse.preset.${p}`)}
                    </option>
                  ))}
                </select>
                <textarea
                  {...control}
                  placeholder={t('jobs.refuse.placeholder')}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </>
            )}
          </Field>
          <DialogFoot>
            <Button onClick={() => setRefusing(null)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="danger">
              {t('jobs.refuse.submit')}
            </Button>
          </DialogFoot>
        </DialogBody>
      </Dialog>
    </>
  )
}
