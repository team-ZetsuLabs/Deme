import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../components/Button'
import { cell, TableWrap } from '../../components/DataTable'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field from '../../components/Field'
import Icon from '../../components/Icon'
import { PageHead, Panel, PanelBody } from '../../components/Panel'
import { Tag, Tags } from '../../components/Status'
import { useConfirm } from '../../components/ConfirmProvider'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { daysAgoToTime, formatDate } from '../../features/admin/format'
import type { Tag as TagModel } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{1,23}$/

export default function TagsPage() {
  const { t, i18n } = useTranslation()
  const { tags, createTag, mergeTag, deleteTag } = useAdminStore()
  const notify = useToast()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [merging, setMerging] = useState<TagModel | null>(null)
  const [target, setTarget] = useState('')
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.tags') },
  ])

  const value = name.trim().toLowerCase()
  const error = !submitted
    ? undefined
    : !TAG_PATTERN.test(value)
      ? t('tags.invalid')
      : tags.some((tag) => tag.name === value || tag.synonyms.includes(value))
        ? t('tags.exists', { name: value })
        : undefined

  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!TAG_PATTERN.test(value)) return
    if (tags.some((tag) => tag.name === value || tag.synonyms.includes(value))) return
    createTag(value)
    notify(t('tags.created', { name: value }))
    setName('')
    setSubmitted(false)
  }

  function openMerge(tag: TagModel) {
    setMerging(tag)
    setTarget(tags.find((x) => x.name !== tag.name)?.name ?? '')
  }

  function confirmMerge(event: FormEvent) {
    event.preventDefault()
    if (!merging || !target) return
    mergeTag(merging.name, target)
    notify(t('tags.merged', { from: merging.name, into: target }))
    setMerging(null)
  }

  async function remove(tag: TagModel) {
    const ok = await confirm({
      title: t('tags.deleteTitle'),
      text: t('tags.deleteText', { name: tag.name }),
      okLabel: t('tags.delete'),
      danger: true,
    })
    if (!ok) return
    deleteTag(tag.name)
    notify(t('tags.deleted'))
  }

  return (
    <>
      <PageHead title={t('nav.tags')} description={t('tags.lead')} />
      <Panel style={{ marginBottom: 24 }}>
        <PanelBody>
          <form
            onSubmit={submit}
            noValidate
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}
          >
            <Field
              label={t('tags.newTag')}
              hint={t('tags.hint')}
              error={error}
              style={{ margin: 0, flex: 1, minWidth: 220 }}
            >
              {(control) => (
                <input
                  {...control}
                  placeholder={t('tags.placeholder')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" variant="primary" style={{ marginTop: 27 }}>
              <Icon name="plus" size={13} />
              {t('tags.create')}
            </Button>
          </form>
        </PanelBody>
      </Panel>

      <Panel>
        <TableWrap>
          <thead>
            <tr>
              <th>{t('tags.col.tag')}</th>
              <th className={cell.num}>{t('tags.col.questions')}</th>
              <th className={cell.hideSm}>{t('tags.col.synonyms')}</th>
              <th className={cell.hideSm}>{t('tags.col.created')}</th>
              <th className={cell.right}>{t('tags.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {[...tags]
              .sort((a, b) => b.count - a.count)
              .map((tag) => (
                <tr key={tag.name}>
                  <td>
                    <Tag>{tag.name}</Tag>
                  </td>
                  <td className={cell.num}>{tag.count}</td>
                  <td className={cell.hideSm}>
                    {tag.synonyms.length ? (
                      <Tags>
                        {tag.synonyms.map((s) => (
                          <Tag key={s} soft>
                            {s}
                          </Tag>
                        ))}
                      </Tags>
                    ) : (
                      <span className={cell.muted}>{t('tags.none')}</span>
                    )}
                  </td>
                  <td className={`${cell.hideSm} ${cell.muted}`}>
                    {formatDate(daysAgoToTime(tag.createdDaysAgo), i18n.language, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className={cell.rowActions}>
                      <Button size="sm" variant="ghost" onClick={() => openMerge(tag)}>
                        {t('tags.merge')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={tag.count > 0}
                        title={tag.count > 0 ? t('tags.deleteDisabled') : undefined}
                        onClick={() => remove(tag)}
                      >
                        {t('tags.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Dialog open={merging !== null} title={t('tags.mergeTitle')} onClose={() => setMerging(null)}>
        <DialogBody onSubmit={confirmMerge}>
          <DialogLead>{t('tags.mergeLead', { name: merging?.name })}</DialogLead>
          <Field label={t('tags.mergeInto')} select>
            {(control) => (
              <select
                {...control}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              >
                {tags
                  .filter((x) => x.name !== merging?.name)
                  .map((x) => (
                    <option key={x.name} value={x.name}>
                      {x.name}
                    </option>
                  ))}
              </select>
            )}
          </Field>
          <DialogFoot>
            <Button onClick={() => setMerging(null)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary">
              {t('tags.merge')}
            </Button>
          </DialogFoot>
        </DialogBody>
      </Dialog>
    </>
  )
}
