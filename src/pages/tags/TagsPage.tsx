import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Dialog from '../../components/Dialog'
import Field from '../../components/Field'
import ItemCard from '../../components/ItemCard'
import ItemList from '../../components/ItemList'
import PageHeader from '../../components/PageHeader'
import StateMessage from '../../components/StateMessage'
import { useSimulatedLoad } from '../../hooks/useSimulatedLoad'
import { SAMPLE_TAGS } from '../../features/tags/sampleTags'
import type { TagItem } from '../../features/tags/sampleTags'

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{1,29}$/

export default function TagsPage() {
  const { t } = useTranslation()
  const loading = useSimulatedLoad()
  const [tags, setTags] = useState<TagItem[]>(SAMPLE_TAGS)
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [merging, setMerging] = useState<TagItem | null>(null)
  const [targetId, setTargetId] = useState('')

  const clean = name.trim().toLowerCase()
  const nameError = !submitted
    ? undefined
    : !TAG_PATTERN.test(clean)
      ? t('tags.create.invalid')
      : tags.some((tag) => tag.name === clean)
        ? t('tags.create.exists')
        : undefined

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!TAG_PATTERN.test(clean) || tags.some((tag) => tag.name === clean)) return
    setTags((items) => [...items, { id: Date.now(), name: clean, usage: 0 }])
    setName('')
    setSubmitted(false)
  }

  function closeMerge() {
    setMerging(null)
    setTargetId('')
  }

  function confirmMerge() {
    if (!merging || !targetId) return
    setTags((items) =>
      items
        .filter((tag) => tag.id !== merging.id)
        .map((tag) =>
          tag.id === Number(targetId) ? { ...tag, usage: tag.usage + merging.usage } : tag,
        ),
    )
    closeMerge()
  }

  return (
    <>
      <PageHeader title={t('tags.title')} description={t('tags.intro')} />

      <form
        onSubmit={handleCreate}
        noValidate
        style={{ marginBottom: 'var(--space-5)', maxWidth: '26rem' }}
      >
        <Field label={t('tags.create.label')} hint={t('tags.create.hint')} error={nameError}>
          {(control) => (
            <input {...control} value={name} onChange={(event) => setName(event.target.value)} />
          )}
        </Field>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button type="submit" variant="primary">
            {t('tags.create.submit')}
          </Button>
        </div>
      </form>

      {loading ? (
        <StateMessage kind="loading" />
      ) : tags.length === 0 ? (
        <StateMessage kind="empty" message={t('tags.empty')} />
      ) : (
        <ItemList label={t('nav.tags')}>
          {tags.map((tag) => (
            <ItemCard
              key={tag.id}
              title={tag.name}
              badges={
                <Badge tone={tag.usage === 0 ? 'warning' : 'neutral'}>
                  {t('tags.usage', { count: tag.usage })}
                </Badge>
              }
              actions={
                <>
                  <Button onClick={() => setMerging(tag)}>{t('tags.merge')}</Button>
                  <Button
                    variant="danger"
                    disabled={tag.usage > 0}
                    title={tag.usage > 0 ? t('tags.deleteDisabled') : undefined}
                    onClick={() => setTags((items) => items.filter((i) => i.id !== tag.id))}
                  >
                    {t('tags.delete')}
                  </Button>
                </>
              }
            />
          ))}
        </ItemList>
      )}

      <Dialog
        open={merging !== null}
        title={t('tags.mergeDialog.title', { name: merging?.name })}
        onClose={closeMerge}
        footer={
          <>
            <Button onClick={closeMerge}>{t('common.cancel')}</Button>
            <Button variant="primary" disabled={!targetId} onClick={confirmMerge}>
              {t('tags.merge')}
            </Button>
          </>
        }
      >
        <Field label={t('tags.mergeDialog.target')} hint={t('tags.mergeDialog.hint')}>
          {(control) => (
            <select
              {...control}
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
            >
              <option value="">{t('tags.mergeDialog.choose')}</option>
              {tags
                .filter((tag) => tag.id !== merging?.id)
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          )}
        </Field>
      </Dialog>
    </>
  )
}
