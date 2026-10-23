import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import Field from '../../components/Field'
import ItemCard from '../../components/ItemCard'
import ItemList from '../../components/ItemList'
import PageHeader from '../../components/PageHeader'
import SegmentedControl from '../../components/SegmentedControl'
import type { SegmentedOption } from '../../components/SegmentedControl'
import StateMessage from '../../components/StateMessage'
import { useSimulatedLoad } from '../../hooks/useSimulatedLoad'
import { SAMPLE_JOBS } from '../../features/jobs/sampleJobs'
import type { JobOffer, JobStatus } from '../../features/jobs/sampleJobs'

const MIN_REASON_LENGTH = 10

export default function JobsPage() {
  const { t } = useTranslation()
  const loading = useSimulatedLoad()
  const [jobs, setJobs] = useState<JobOffer[]>(SAMPLE_JOBS)
  const [view, setView] = useState<JobStatus>('pending')
  const [refusing, setRefusing] = useState<JobOffer | null>(null)
  const [reason, setReason] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)

  const visible = jobs.filter((job) => job.status === view)
  const reasonError =
    reasonTouched && reason.trim().length < MIN_REASON_LENGTH
      ? t('jobs.reasonError', { count: MIN_REASON_LENGTH })
      : undefined

  function approve(job: JobOffer) {
    setJobs((items) => items.map((i) => (i.id === job.id ? { ...i, status: 'approved' } : i)))
  }

  function closeRefusal() {
    setRefusing(null)
    setReason('')
    setReasonTouched(false)
  }

  function confirmRefusal() {
    setReasonTouched(true)
    if (!refusing || reason.trim().length < MIN_REASON_LENGTH) return
    setJobs((items) =>
      items.map((i) =>
        i.id === refusing.id ? { ...i, status: 'refused', refusalReason: reason.trim() } : i,
      ),
    )
    closeRefusal()
  }

  const options: SegmentedOption<JobStatus>[] = (['pending', 'approved', 'refused'] as const).map(
    (status) => ({
      value: status,
      label: t(`jobs.status.${status}`),
      count: jobs.filter((j) => j.status === status).length,
    }),
  )

  return (
    <>
      <PageHeader title={t('jobs.title')} description={t('jobs.intro')} />
      <SegmentedControl
        label={t('jobs.filter')}
        options={options}
        value={view}
        onChange={(next) => setView(next)}
      />

      {loading ? (
        <StateMessage kind="loading" />
      ) : visible.length === 0 ? (
        <StateMessage kind="empty" message={t('jobs.empty')} />
      ) : (
        <ItemList label={t('nav.jobs')}>
          {visible.map((job) => (
            <ItemCard
              key={job.id}
              title={job.title}
              meta={`${job.company} · ${job.city}, ${job.country}`}
              badges={
                <>
                  <Badge tone="info">{t(`jobs.type.${job.type}`)}</Badge>
                  <Badge tone={job.domainVerified ? 'success' : 'danger'}>
                    {t(job.domainVerified ? 'jobs.domainVerified' : 'jobs.domainUnverified')}
                  </Badge>
                  <Badge tone={job.salaryShown ? 'neutral' : 'warning'}>
                    {t(job.salaryShown ? 'jobs.salaryShown' : 'jobs.salaryMissing')}
                  </Badge>
                </>
              }
              actions={
                job.status === 'pending' && (
                  <>
                    <Button variant="primary" onClick={() => approve(job)}>
                      {t('jobs.approve')}
                    </Button>
                    <Button variant="danger" onClick={() => setRefusing(job)}>
                      {t('jobs.refuse')}
                    </Button>
                  </>
                )
              }
            >
              <p>{job.technologies.join(', ')}</p>
              {job.refusalReason && (
                <p>
                  <strong>{t('jobs.reasonLabel')}</strong> {job.refusalReason}
                </p>
              )}
            </ItemCard>
          ))}
        </ItemList>
      )}

      <Dialog
        open={refusing !== null}
        title={t('jobs.refuseTitle')}
        onClose={closeRefusal}
        footer={
          <>
            <Button onClick={closeRefusal}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={confirmRefusal}>
              {t('jobs.refuse')}
            </Button>
          </>
        }
      >
        <Field label={t('jobs.reasonLabel')} hint={t('jobs.reasonHint')} error={reasonError}>
          {(control) => (
            <textarea
              {...control}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setReasonTouched(true)}
            />
          )}
        </Field>
      </Dialog>
    </>
  )
}
