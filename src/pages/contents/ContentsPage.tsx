import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { cell, TableWrap, Who } from '../../components/DataTable'
import { Filters, PageHead, Panel } from '../../components/Panel'
import Segmented from '../../components/Segmented'
import { Status, Tag, Tags } from '../../components/Status'
import { useToast } from '../../components/ToastProvider'
import { useAdminStore } from '../../features/admin/AdminStore'
import { daysAgoToTime, formatDayMonth } from '../../features/admin/format'
import type { ContentStatus } from '../../features/admin/types'
import { useCrumbs } from '../../layout/crumbs'

type Filter = ContentStatus | 'all'
const STATUS_TONE = { published: 'good', hidden: 'serious', closed: 'neutral' } as const

export default function ContentsPage() {
  const { t, i18n } = useTranslation()
  const { contents, userBy, setContentStatus } = useAdminStore()
  const notify = useToast()
  const [filter, setFilter] = useState<Filter>('all')
  useCrumbs([
    { label: t('shell.groups.moderation'), to: '/signalements' },
    { label: t('nav.contents') },
  ])

  const list = contents.filter((c) => filter === 'all' || c.status === filter)
  const options = [
    { value: 'all' as Filter, label: t('contents.all'), count: contents.length },
    ...(['published', 'hidden', 'closed'] as const).map((s) => ({
      value: s as Filter,
      label: t(`contents.filter.${s}`),
      count: contents.filter((c) => c.status === s).length,
    })),
  ]

  function change(id: number, status: ContentStatus) {
    const undo = setContentStatus(id, status)
    notify(t(`contents.toast.${status}`), undo)
  }

  return (
    <>
      <PageHead title={t('nav.contents')} description={t('contents.lead')} />
      <Filters>
        <Segmented<Filter>
          label={t('contents.filterLabel')}
          options={options}
          value={filter}
          onChange={setFilter}
        />
      </Filters>
      <Panel>
        <TableWrap>
          <thead>
            <tr>
              <th>{t('contents.col.question')}</th>
              <th className={cell.hideSm}>{t('contents.col.author')}</th>
              <th className={cell.hideSm}>{t('contents.col.tags')}</th>
              <th className={cell.num}>{t('contents.col.answers')}</th>
              <th className={cell.num}>{t('contents.col.flags')}</th>
              <th>{t('contents.col.status')}</th>
              <th className={cell.right}>{t('contents.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const author = userBy(c.author)
              return (
                <tr key={c.id}>
                  <td>
                    <a
                      className={cell.title}
                      href={`/question/${c.id}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {c.title}
                    </a>
                    <small className={cell.muted}>
                      {t('contents.publishedOn', {
                        date: formatDayMonth(daysAgoToTime(c.daysAgo), i18n.language),
                      })}
                    </small>
                  </td>
                  <td className={cell.hideSm}>
                    <Link to={`/utilisateurs/${c.author}`}>
                      <Who
                        avatar={<Avatar name={author?.name ?? c.author} size={24} />}
                        name={author?.name ?? c.author}
                      />
                    </Link>
                  </td>
                  <td className={cell.hideSm}>
                    <Tags>
                      {c.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Tags>
                  </td>
                  <td className={cell.num}>{c.answers}</td>
                  <td
                    className={cell.num}
                    style={c.flags ? { color: 'var(--crit-text)', fontWeight: 600 } : undefined}
                  >
                    {c.flags}
                  </td>
                  <td>
                    <Status tone={STATUS_TONE[c.status]}>{t(`contents.status.${c.status}`)}</Status>
                  </td>
                  <td>
                    <div className={cell.rowActions}>
                      {c.status === 'hidden' ? (
                        <Button size="sm" onClick={() => change(c.id, 'published')}>
                          {t('contents.republish')}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => change(c.id, 'hidden')}>
                          {t('contents.hide')}
                        </Button>
                      )}
                      {c.status === 'closed' ? (
                        <Button size="sm" variant="ghost" onClick={() => change(c.id, 'published')}>
                          {t('contents.reopen')}
                        </Button>
                      ) : c.status === 'published' ? (
                        <Button size="sm" variant="ghost" onClick={() => change(c.id, 'closed')}>
                          {t('contents.close')}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  )
}
