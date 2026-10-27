import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { JobDetail } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import Icon from '../../components/Icon'
import MemberContent from '../../components/MemberContent'
import NoteDialog from '../../components/NoteDialog'
import { EmptyState, Filters, PageHead, Panel } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Pill, Tag, Tags } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import { formatAgo, formatDate } from '../../features/admin/format'
import { useCounts } from '../../layout/counts'
import { useCrumbs } from '../../layout/crumbs'
import styles from './JobsPage.module.css'
import utils from '../../styles/utils.module.css'

type Tab = 'PENDING' | 'PUBLISHED' | 'REJECTED'
const TABS: Tab[] = ['PENDING', 'PUBLISHED', 'REJECTED']

export default function JobsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const notify = useToast()
  const counts = useCounts()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [refusing, setRefusing] = useState<JobDetail | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  useCrumbs([{ label: t('shell.groups.community'), to: '/utilisateurs' }, { label: t('nav.jobs') }])

  const query = useQuery(
    (signal) => adminApi.listJobs({ status: tab, size: 50 }, { signal }),
    [tab],
  )
  const pending = useQuery(
    (signal) => adminApi.listJobs({ status: 'PENDING', size: 1 }, { signal }),
    [],
  )
  const published = useQuery(
    (signal) => adminApi.listJobs({ status: 'PUBLISHED', size: 1 }, { signal }),
    [],
  )
  const refused = useQuery(
    (signal) => adminApi.listJobs({ status: 'REJECTED', size: 1 }, { signal }),
    [],
  )
  const totals: Record<Tab, number | undefined> = {
    PENDING: pending.data?.total,
    PUBLISHED: published.data?.total,
    REJECTED: refused.data?.total,
  }

  function reloadAll() {
    query.reload()
    pending.reload()
    published.reload()
    refused.reload()
    counts.refresh()
  }

  async function decide(job: JobDetail, decision: 'APPROVE' | 'REJECT', reason?: string) {
    setBusyId(job.id)
    try {
      await adminApi.decideJob(job.id, decision, reason)
      notify(
        decision === 'APPROVE'
          ? t('jobs.published', { company: job.companyName })
          : t('jobs.refusedToast', { company: job.companyName }),
      )
      reloadAll()
    } catch (error) {
      notify(errorMessage(t, error))
    } finally {
      setBusyId(null)
    }
  }

  const options = TABS.map((value) => ({
    value,
    label: t(`jobStatus.${value}`),
    count: totals[value],
  }))

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
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState title={t(`jobs.none.${tab}`)}>{t('jobs.noneHint')}</EmptyState>}
        >
          {(d) =>
            tab === 'PENDING' ? (
              d.items.map((job) => {
                const site = job.companyWebsite ? safeHttpUrl(job.companyWebsite) : null
                return (
                  <article key={job.id} className={styles.card}>
                    <Avatar name={job.companyName} size={48} square />
                    <div>
                      <h2>{job.title}</h2>
                      <p className={styles.meta}>
                        {t('jobs.meta', {
                          company: job.companyName,
                          place:
                            [job.city, job.countryCode].filter(Boolean).join(', ') ||
                            t('jobs.remote'),
                          type: t(`jobType.${job.type}`),
                          ago: formatAgo(job.createdAt, lang),
                          by: job.recruiter.displayName,
                        })}
                      </p>
                      <div className={styles.checks}>
                        <span className={job.compensation ? styles.ok : styles.ko}>
                          <Icon name={job.compensation ? 'check' : 'x'} size={13} />
                          {t('jobs.check.pay')}
                          <span className={utils.srOnly}>
                            {job.compensation ? t('jobs.yes') : t('jobs.no')}
                          </span>
                        </span>
                        <span className={site ? styles.ok : styles.ko}>
                          <Icon name={site ? 'check' : 'x'} size={13} />
                          {t('jobs.check.website')}
                          <span className={utils.srOnly}>
                            {site ? t('jobs.yes') : t('jobs.no')}
                          </span>
                        </span>
                      </div>
                      <Tags>
                        {job.technologies.map((tech) => (
                          <Tag key={tech}>{tech}</Tag>
                        ))}
                      </Tags>
                      <details className={styles.details}>
                        <summary>{t('jobs.viewAd')}</summary>
                        {job.compensation && (
                          <p>
                            <b>{t('jobs.compensation')}</b> {job.compensation}
                          </p>
                        )}
                        {site && (
                          <p>
                            <a href={site} target="_blank" rel="noopener noreferrer">
                              {site}
                            </a>
                          </p>
                        )}
                        <MemberContent html={job.descriptionHtml} />
                      </details>
                    </div>
                    <div className={styles.acts}>
                      <Button
                        variant="primary"
                        busy={busyId === job.id}
                        onClick={() => decide(job, 'APPROVE')}
                      >
                        {t('jobs.approve')}
                      </Button>
                      <Button variant="dangerLine" onClick={() => setRefusing(job)}>
                        {t('jobs.refuse.action')}
                      </Button>
                    </div>
                  </article>
                )
              })
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th>{t('jobs.col.offer')}</th>
                    <th className={cell.hideSm}>{t('jobs.col.company')}</th>
                    <th className={cell.num}>{t('jobs.col.applicants')}</th>
                    {tab === 'REJECTED' && <th>{t('jobs.col.reason')}</th>}
                    <th className={cell.right}>{t('jobs.col.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <span className={cell.title}>{job.title}</span>
                        <Pill>{t(`jobStatus.${job.status}`)}</Pill>
                      </td>
                      <td className={cell.hideSm}>{job.companyName}</td>
                      <td className={cell.num}>{job.applicationCount ?? 0}</td>
                      {tab === 'REJECTED' && <td>{job.rejectionReason}</td>}
                      <td className={`${cell.right} ${cell.muted}`}>
                        {formatDate(job.updatedAt, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )
          }
        </QueryState>
      </Panel>

      <NoteDialog
        open={refusing !== null}
        title={t('jobs.refuse.title')}
        lead={t('jobs.refuse.lead', { company: refusing?.companyName })}
        label={t('jobs.refuse.reasonLabel')}
        placeholder={t('jobs.refuse.placeholder')}
        minLength={15}
        submitLabel={t('jobs.refuse.submit')}
        danger
        onClose={() => setRefusing(null)}
        onSubmit={async (reason) => {
          const job = refusing
          setRefusing(null)
          if (job) await decide(job, 'REJECT', reason)
        }}
      />
    </>
  )
}
