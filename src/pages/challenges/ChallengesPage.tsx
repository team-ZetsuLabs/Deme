import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import Field from '../../components/Field'
import ItemCard from '../../components/ItemCard'
import ItemList from '../../components/ItemList'
import PageHeader from '../../components/PageHeader'
import StateMessage from '../../components/StateMessage'
import { useSimulatedLoad } from '../../hooks/useSimulatedLoad'
import { safeHttpUrl } from '../../features/challenges/safeUrl'
import { SAMPLE_CHALLENGE, SAMPLE_SUBMISSIONS } from '../../features/challenges/sampleChallenges'
import type { Challenge, Submission } from '../../features/challenges/sampleChallenges'

function parseScore(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= 100 ? n : null
}

export default function ChallengesPage() {
  const { t, i18n } = useTranslation()
  const loading = useSimulatedLoad()
  const [challenge, setChallenge] = useState<Challenge>(SAMPLE_CHALLENGE)
  const [submissions, setSubmissions] = useState<Submission[]>(SAMPLE_SUBMISSIONS)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [saved, setSaved] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', brief: '', points: '20', endsOn: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const endDate = new Date(challenge.endsOn).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formErrors = {
    title: form.title.trim().length < 5 ? t('challenges.form.titleError') : undefined,
    brief: form.brief.trim().length < 20 ? t('challenges.form.briefError') : undefined,
    points:
      Number.isInteger(Number(form.points)) && Number(form.points) > 0
        ? undefined
        : t('challenges.form.pointsError'),
    endsOn: form.endsOn ? undefined : t('challenges.form.endsOnError'),
  }

  function closeForm() {
    setCreating(false)
    setFormSubmitted(false)
  }

  function createChallenge() {
    setFormSubmitted(true)
    if (Object.values(formErrors).some(Boolean)) return
    setChallenge({
      id: Date.now(),
      title: form.title.trim(),
      brief: form.brief.trim(),
      points: Number(form.points),
      endsOn: form.endsOn,
    })
    setSubmissions([])
    setForm({ title: '', brief: '', points: '20', endsOn: '' })
    closeForm()
  }

  function saveScore(submission: Submission) {
    const draft = drafts[submission.id] ?? submission.score?.toString() ?? ''
    const score = parseScore(draft)
    if (score === null) return
    setSubmissions((items) => items.map((s) => (s.id === submission.id ? { ...s, score } : s)))
    setSaved(submission.id)
  }

  return (
    <>
      <PageHeader
        title={t('challenges.title')}
        description={t('challenges.intro')}
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            {t('challenges.create')}
          </Button>
        }
      />

      {loading ? (
        <StateMessage kind="loading" />
      ) : (
        <>
          <section aria-labelledby="current-challenge" style={{ marginBottom: 'var(--space-6)' }}>
            <ItemList label={t('challenges.current')}>
              <ItemCard
                title={challenge.title}
                meta={t('challenges.endsOn', { date: endDate })}
                badges={
                  <Badge tone="info">{t('challenges.points', { count: challenge.points })}</Badge>
                }
              >
                <p>{challenge.brief}</p>
              </ItemCard>
            </ItemList>
          </section>

          <h2 id="current-challenge" style={{ marginBottom: 'var(--space-3)' }}>
            {t('challenges.submissions')}
          </h2>
          {submissions.length === 0 ? (
            <StateMessage kind="empty" message={t('challenges.noSubmissions')} />
          ) : (
            <ItemList label={t('challenges.submissions')}>
              {submissions.map((submission) => {
                const href = safeHttpUrl(submission.repoUrl)
                const draft = drafts[submission.id] ?? submission.score?.toString() ?? ''
                const invalid = draft !== '' && parseScore(draft) === null
                return (
                  <ItemCard
                    key={submission.id}
                    leading={<Avatar name={submission.member} />}
                    title={submission.member}
                    meta={submission.country}
                    badges={
                      <Badge tone={submission.score === null ? 'warning' : 'success'}>
                        {submission.score === null
                          ? t('challenges.toGrade')
                          : t('challenges.graded', { score: submission.score })}
                      </Badge>
                    }
                    actions={
                      <>
                        <div style={{ width: '9rem' }}>
                          <Field
                            label={t('challenges.score')}
                            error={invalid ? t('challenges.scoreError') : undefined}
                          >
                            {(control) => (
                              <input
                                {...control}
                                inputMode="numeric"
                                value={draft}
                                onChange={(event) => {
                                  setSaved(null)
                                  setDrafts((d) => ({ ...d, [submission.id]: event.target.value }))
                                }}
                              />
                            )}
                          </Field>
                        </div>
                        <Button
                          variant="primary"
                          style={{ alignSelf: 'flex-end' }}
                          onClick={() => saveScore(submission)}
                        >
                          {t('challenges.saveScore')}
                        </Button>
                        {saved === submission.id && (
                          <p role="status" style={{ alignSelf: 'center' }}>
                            {t('challenges.saved')}
                          </p>
                        )}
                      </>
                    }
                  >
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {href}
                      </a>
                    ) : (
                      <p>{t('challenges.invalidLink')}</p>
                    )}
                  </ItemCard>
                )
              })}
            </ItemList>
          )}
        </>
      )}

      <Dialog
        open={creating}
        title={t('challenges.create')}
        onClose={closeForm}
        footer={
          <>
            <Button onClick={closeForm}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={createChallenge}>
              {t('challenges.form.submit')}
            </Button>
          </>
        }
      >
        <Field
          label={t('challenges.form.title')}
          error={formSubmitted ? formErrors.title : undefined}
        >
          {(control) => (
            <input
              {...control}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          )}
        </Field>
        <Field
          label={t('challenges.form.brief')}
          error={formSubmitted ? formErrors.brief : undefined}
        >
          {(control) => (
            <textarea
              {...control}
              value={form.brief}
              onChange={(event) => setForm({ ...form, brief: event.target.value })}
            />
          )}
        </Field>
        <Field
          label={t('challenges.form.points')}
          error={formSubmitted ? formErrors.points : undefined}
        >
          {(control) => (
            <input
              {...control}
              inputMode="numeric"
              value={form.points}
              onChange={(event) => setForm({ ...form, points: event.target.value })}
            />
          )}
        </Field>
        <Field
          label={t('challenges.form.endsOn')}
          error={formSubmitted ? formErrors.endsOn : undefined}
        >
          {(control) => (
            <input
              {...control}
              type="date"
              value={form.endsOn}
              onChange={(event) => setForm({ ...form, endsOn: event.target.value })}
            />
          )}
        </Field>
      </Dialog>
    </>
  )
}
