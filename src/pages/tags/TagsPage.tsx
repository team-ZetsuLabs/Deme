import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from '../../api/endpoints'
import { errorMessage } from '../../api/errorMessage'
import type { AdminTag } from '../../api/types'
import { useQuery } from '../../api/useQuery'
import Button from '../../components/Button'
import { useConfirm } from '../../components/ConfirmProvider'
import { cell, Pager, TableWrap } from '../../components/DataTable'
import Dialog, { DialogBody, DialogFoot, DialogLead } from '../../components/Dialog'
import Field, { compactSelectClass, inputClass, selectClass } from '../../components/Field'
import Icon from '../../components/Icon'
import { EmptyState, Filters, PageHead, Panel, PanelBody } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import { Tag } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCrumbs } from '../../layout/crumbs'
import utils from '../../styles/utils.module.css'

const TAG_PATTERN = /^[a-z0-9][a-z0-9.+#-]{0,29}$/
const PAGE_SIZE = 50

export default function TagsPage() {
  const { t } = useTranslation()
  const notify = useToast()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const [search, setSearch] = useState('')
  const [unused, setUnused] = useState(false)
  const [page, setPage] = useState(1)
  const [merging, setMerging] = useState<AdminTag | null>(null)
  const [target, setTarget] = useState('')
  const q = useDebouncedValue(search)
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.tags') },
  ])

  const query = useQuery(
    (signal) =>
      adminApi.listTags(
        { q: q || undefined, unused: unused || undefined, page: page - 1, size: PAGE_SIZE },
        { signal },
      ),
    [q, unused, page],
  )

  const value = name.trim().toLowerCase()
  const error = submitted && !TAG_PATTERN.test(value) ? t('tags.invalid') : serverError

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      notify(success)
      query.reload()
      return true
    } catch (e) {
      notify(errorMessage(t, e))
      return false
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    setServerError(undefined)
    if (!TAG_PATTERN.test(value)) return
    try {
      await adminApi.createTag(value)
      notify(t('tags.created', { name: value }))
      setName('')
      setSubmitted(false)
      query.reload()
    } catch (e) {
      setServerError(errorMessage(t, e))
    }
  }

  async function confirmMerge(event: FormEvent) {
    event.preventDefault()
    const into = target.trim().toLowerCase()
    if (!merging || !into || into === merging.name) return
    const ok = await run(
      () => adminApi.mergeTag(merging.name, into),
      t('tags.merged', { from: merging.name, into }),
    )
    if (ok) setMerging(null)
  }

  async function remove(tag: AdminTag) {
    const ok = await confirm({
      title: t('tags.deleteTitle'),
      text: t('tags.deleteText', { name: tag.name }),
      okLabel: t('tags.delete'),
      danger: true,
    })
    if (ok) await run(() => adminApi.deleteTag(tag.name), t('tags.deleted'))
  }

  const total = query.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isUnused = (tag: AdminTag) =>
    tag.questionCount + tag.jobCount + tag.missionCount + tag.memberCount === 0

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
                  maxLength={30}
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

      <Filters>
        <label className={utils.srOnly} htmlFor="tagSearch">
          {t('tags.search')}
        </label>
        <input
          id="tagSearch"
          type="search"
          className={inputClass}
          style={{ width: 260, minHeight: 36, fontSize: 14 }}
          placeholder={t('tags.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <label className={utils.srOnly} htmlFor="tagUsage">
          {t('tags.usageFilter')}
        </label>
        <select
          id="tagUsage"
          className={`${selectClass} ${compactSelectClass}`}
          value={unused ? 'unused' : 'all'}
          onChange={(event) => {
            setUnused(event.target.value === 'unused')
            setPage(1)
          }}
        >
          <option value="all">{t('tags.allTags')}</option>
          <option value="unused">{t('tags.onlyUnused')}</option>
        </select>
      </Filters>

      <Panel>
        <QueryState
          query={query}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState title={t('tags.emptyTitle')}>{t('tags.emptyHint')}</EmptyState>}
        >
          {(d) => (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <th>{t('tags.col.tag')}</th>
                    <th className={cell.num}>{t('tags.col.questions')}</th>
                    <th className={`${cell.num} ${cell.hideSm}`}>{t('tags.col.jobs')}</th>
                    <th className={`${cell.num} ${cell.hideSm}`}>{t('tags.col.missions')}</th>
                    <th className={`${cell.num} ${cell.hideSm}`}>{t('tags.col.members')}</th>
                    <th className={cell.right}>{t('tags.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((tag) => (
                    <tr key={tag.name}>
                      <td>
                        <Tag>{tag.name}</Tag>
                      </td>
                      <td className={cell.num}>{tag.questionCount}</td>
                      <td className={`${cell.num} ${cell.hideSm}`}>{tag.jobCount}</td>
                      <td className={`${cell.num} ${cell.hideSm}`}>{tag.missionCount}</td>
                      <td className={`${cell.num} ${cell.hideSm}`}>{tag.memberCount}</td>
                      <td>
                        <div className={cell.rowActions}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setMerging(tag)
                              setTarget('')
                            }}
                          >
                            {t('tags.merge')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!isUnused(tag)}
                            title={!isUnused(tag) ? t('tags.deleteDisabled') : undefined}
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
              {pages > 1 && (
                <Pager summary={t('common.page', { page, pages })}>
                  <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {t('common.previous')}
                  </Button>
                  <Button size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                    {t('common.next')}
                  </Button>
                </Pager>
              )}
            </>
          )}
        </QueryState>
      </Panel>

      <Dialog open={merging !== null} title={t('tags.mergeTitle')} onClose={() => setMerging(null)}>
        <DialogBody onSubmit={confirmMerge}>
          <DialogLead>{t('tags.mergeLead', { name: merging?.name })}</DialogLead>
          <Field label={t('tags.mergeInto')} hint={t('tags.mergeHint')}>
            {(control) => (
              <input
                {...control}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              />
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
