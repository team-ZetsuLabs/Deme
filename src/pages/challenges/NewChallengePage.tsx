import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button, { ButtonLink } from '../../components/Button'
import { inputClass } from '../../components/Field'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import { Grid2, PageHead, Panel, PanelBody, PanelHead, SaveBar } from '../../components/Panel'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { formatDate } from '../../features/admin/format'
import { useCrumbs } from '../../layout/crumbs'
import styles from './NewChallengePage.module.css'
import utils from '../../styles/utils.module.css'

type Endpoint = { id: number; method: string; description: string }
const METHODS = ['GET', 'POST', 'PUT', 'DELETE']
const isoDay = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

export default function NewChallengePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { createChallenge } = useAdminStore()
  const notify = useToast()
  const navigate = useNavigate()
  useCrumbs([
    { label: t('shell.groups.community'), to: '/utilisateurs' },
    { label: t('nav.challenges'), to: '/challenges' },
    { label: t('challenges.newTitle') },
  ])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    { id: 1, method: 'POST', description: t('challenges.defaultEndpoint1') },
    { id: 2, method: 'GET', description: t('challenges.defaultEndpoint2') },
  ])
  const [start, setStart] = useState(isoDay(4))
  const [end, setEnd] = useState(isoDay(10))
  const [points, setPoints] = useState('20')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  const errors = {
    title: title.trim().length < 10 ? t('challenges.errors.title') : undefined,
    description: description.trim().length < 40 ? t('challenges.errors.description') : undefined,
    date: end <= start ? t('challenges.errors.date') : undefined,
  }

  function patchEndpoint(id: number, patch: Partial<Endpoint>) {
    setEndpoints((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (errors.title || errors.description || errors.date) return
    setBusy(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    createChallenge({ title: title.trim(), start, end, points: Number(points) || 20 })
    navigate('/challenges')
    notify(t('challenges.scheduled'))
  }

  const preview = {
    title: title.trim() || t('challenges.previewTitle'),
    description: description.trim() || t('challenges.previewDescription'),
  }

  return (
    <>
      <PageHead title={t('challenges.newTitle')} description={t('challenges.newLead')} />
      <Grid2>
        <Panel as="form" onSubmit={submit} noValidate>
          <PanelBody>
            <Field label={t('challenges.field.title')} error={submitted ? errors.title : undefined}>
              {(control) => (
                <input
                  {...control}
                  maxLength={80}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              )}
            </Field>
            <Field
              label={t('challenges.field.description')}
              error={submitted ? errors.description : undefined}
            >
              {(control) => (
                <textarea
                  {...control}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              )}
            </Field>
            <p className={styles.label}>{t('challenges.field.endpoints')}</p>
            {endpoints.map((endpoint, i) => (
              <div key={endpoint.id} className={styles.endpoint}>
                <label className={utils.srOnly} htmlFor={`ep-m-${endpoint.id}`}>
                  {t('challenges.field.method', { n: i + 1 })}
                </label>
                <select
                  id={`ep-m-${endpoint.id}`}
                  className={`${inputClass} ${styles.method}`}
                  value={endpoint.method}
                  onChange={(event) => patchEndpoint(endpoint.id, { method: event.target.value })}
                >
                  {METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <label className={utils.srOnly} htmlFor={`ep-d-${endpoint.id}`}>
                  {t('challenges.field.endpointDescription', { n: i + 1 })}
                </label>
                <input
                  id={`ep-d-${endpoint.id}`}
                  className={inputClass}
                  value={endpoint.description}
                  onChange={(event) =>
                    patchEndpoint(endpoint.id, { description: event.target.value })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('challenges.field.removeEndpoint', { n: i + 1 })}
                  disabled={endpoints.length === 1}
                  onClick={() => setEndpoints((list) => list.filter((e) => e.id !== endpoint.id))}
                >
                  <Icon name="x" size={13} />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="ghost"
              style={{ marginBottom: 16 }}
              onClick={() =>
                setEndpoints((list) => [
                  ...list,
                  { id: Date.now(), method: 'GET', description: '' },
                ])
              }
            >
              <Icon name="plus" size={12} />
              {t('challenges.field.addEndpoint')}
            </Button>
            <div className={styles.dates}>
              <Field label={t('challenges.field.start')}>
                {(control) => (
                  <input
                    {...control}
                    type="date"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                  />
                )}
              </Field>
              <Field label={t('challenges.field.end')} error={submitted ? errors.date : undefined}>
                {(control) => (
                  <input
                    {...control}
                    type="date"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                  />
                )}
              </Field>
            </div>
            <Field label={t('challenges.field.points')}>
              {(control) => (
                <input
                  {...control}
                  type="number"
                  min={5}
                  max={100}
                  value={points}
                  onChange={(event) => setPoints(event.target.value)}
                />
              )}
            </Field>
          </PanelBody>
          <SaveBar>
            <ButtonLink variant="ghost" to="/challenges">
              {t('common.cancel')}
            </ButtonLink>
            <Button type="submit" variant="primary" busy={busy}>
              {busy ? t('challenges.scheduling') : t('challenges.schedule')}
            </Button>
          </SaveBar>
        </Panel>
        <Panel>
          <PanelHead title={t('challenges.preview')} />
          <PanelBody>
            <div className={styles.preview}>
              <h3>{preview.title}</h3>
              <p>{preview.description}</p>
              <ul>
                {endpoints.map((endpoint) => (
                  <li key={endpoint.id}>
                    <span>{endpoint.method}</span>
                    {endpoint.description}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 12 }}>
                {t('challenges.previewMeta', {
                  from: formatDate(start, lang),
                  to: formatDate(end, lang),
                  points,
                })}
              </p>
            </div>
          </PanelBody>
        </Panel>
      </Grid2>
    </>
  )
}
