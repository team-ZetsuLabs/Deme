import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { publicApi } from '../../api/endpoints'
import { useQuery } from '../../api/useQuery'
import Button from '../../components/Button'
import { cell, Pager, TableWrap } from '../../components/DataTable'
import { EmptyState, PanelBody } from '../../components/Panel'
import QueryState from '../../components/QueryState'
import Segmented from '../../components/Segmented'
import { Pill, Status, Tag, Tags } from '../../components/Status'
import { fmt, formatAgo, formatDate } from '../admin/format'
import ProjectTable from '../projects/ProjectTable'
import styles from './MemberTabs.module.css'

export type MemberTab = 'overview' | 'projects' | 'questions' | 'missions' | 'reputation'
const SIZE = 10
const MISSION_TONE = { OPEN: 'good', IN_PROGRESS: 'warn', CLOSED: 'neutral' } as const

export type MemberTabsProps = { username: string }

export default function MemberTabs({ username }: MemberTabsProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<MemberTab>('overview')
  const options = (['overview', 'projects', 'questions', 'missions', 'reputation'] as const).map(
    (value) => ({
      value,
      label: t(`users.tabs.${value}`),
    }),
  )
  return (
    <>
      <div className={styles.tabbar}>
        <Segmented<MemberTab>
          kind="tabs"
          underline
          label={t('users.tabs.label')}
          options={options}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'overview' && <Overview username={username} />}
      {tab === 'projects' && <Projects username={username} />}
      {tab === 'questions' && <Questions username={username} />}
      {tab === 'missions' && <Missions username={username} />}
      {tab === 'reputation' && <Reputation username={username} />}
    </>
  )
}

function Overview({ username }: { username: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const profile = useQuery(
    (signal) => publicApi.profile(username, { signal }).catch(() => null),
    [username],
  )
  const badges = useQuery(
    (signal) => publicApi.badges(username, { signal }).catch(() => []),
    [username],
  )

  return (
    <PanelBody>
      <QueryState
        query={profile}
        isEmpty={(p) => p === null}
        empty={<p className={styles.muted}>{t('users.member.profileUnavailable')}</p>}
      >
        {(p) =>
          p && (
            <>
              <div className={styles.stats}>
                <div>
                  <strong>{fmt(p.questionCount, lang)}</strong>
                  <span>{t('users.member.questions')}</span>
                </div>
                <div>
                  <strong>{fmt(p.answerCount, lang)}</strong>
                  <span>{t('users.member.answers')}</span>
                </div>
                <div>
                  <strong>{fmt(p.acceptedCount, lang)}</strong>
                  <span>{t('users.member.accepted')}</span>
                </div>
              </div>
              {p.nextLevelAt != null && (
                <p className={styles.muted}>
                  {t('users.member.nextLevel', { count: p.nextLevelAt })}
                </p>
              )}
              <h3 className={styles.subtitle}>{t('users.member.bio')}</h3>
              <p className={styles.bio}>
                {p.bio || <span className={styles.muted}>{t('users.member.noBio')}</span>}
              </p>
              <h3 className={styles.subtitle}>{t('users.member.technologies')}</h3>
              {p.technologies.length ? (
                <Tags>
                  {p.technologies.map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </Tags>
              ) : (
                <p className={styles.muted}>{t('users.member.noTech')}</p>
              )}
              <p className={styles.muted} style={{ marginTop: 12 }}>
                {t('users.member.recruiters')} :{' '}
                {p.visibleToRecruiters ? t('users.yes') : t('users.no')}
              </p>
            </>
          )
        }
      </QueryState>
      <h3 className={styles.subtitle}>{t('users.member.badges')}</h3>
      <QueryState query={badges}>
        {(list) => (
          <ul className={styles.badges}>
            {list.map((b) => (
              <li key={b.badge} data-earned={b.earned}>
                <b>{t(`badges.${b.badge}`)}</b>
                <small>
                  {b.earned && b.awardedAt
                    ? t('users.member.earnedOn', { date: formatDate(b.awardedAt, lang) })
                    : t('users.member.badgeProgress', { progress: b.progress, target: b.target })}
                </small>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PanelBody>
  )
}

function Projects({ username }: { username: string }) {
  const { t } = useTranslation()
  const query = useQuery(
    (signal) => publicApi.listProjects({ member: username, size: 50 }, { signal }),
    [username],
  )
  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={<EmptyState title={t('users.member.projectsEmpty')} />}
    >
      {(d) => <ProjectTable items={d.items} memberUsername={username} />}
    </QueryState>
  )
}

function Questions({ username }: { username: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [index, setIndex] = useState(1)
  const query = useQuery(
    (signal) =>
      publicApi.listQuestions(
        { author: username, sort: 'RECENT', page: index - 1, size: SIZE },
        { signal },
      ),
    [username, index],
  )
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / SIZE)) : 1
  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={<EmptyState title={t('users.member.questionsEmpty')} />}
    >
      {(d) => (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th>{t('users.member.question')}</th>
                <th className={cell.hideSm}>{t('users.member.tags')}</th>
                <th className={cell.num}>{t('users.member.answersShort')}</th>
                <th className={cell.num}>{t('users.member.score')}</th>
                <th className={`${cell.right} ${cell.hideSm}`}>{t('users.member.date')}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((q) => (
                <tr key={q.id}>
                  <td>
                    <a
                      className={cell.title}
                      href={`/question/${q.id}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {q.title}
                    </a>
                    {q.hasAcceptedAnswer && <Status tone="good">{t('users.member.solved')}</Status>}
                  </td>
                  <td className={cell.hideSm}>
                    <Tags>
                      {q.tags.slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Tags>
                  </td>
                  <td className={cell.num}>{q.answerCount}</td>
                  <td className={cell.num}>{q.score}</td>
                  <td className={`${cell.right} ${cell.muted} ${cell.hideSm}`}>
                    {formatAgo(q.createdAt, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {pages > 1 && (
            <Pager summary={t('common.page', { page: index, pages })}>
              <Button size="sm" disabled={index <= 1} onClick={() => setIndex(index - 1)}>
                {t('common.previous')}
              </Button>
              <Button size="sm" disabled={index >= pages} onClick={() => setIndex(index + 1)}>
                {t('common.next')}
              </Button>
            </Pager>
          )}
        </>
      )}
    </QueryState>
  )
}

function Missions({ username }: { username: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'CLOSED'>('OPEN')
  const query = useQuery(
    (signal) => publicApi.listMissions({ author: username, status, size: 50 }, { signal }),
    [username, status],
  )
  return (
    <>
      <div className={styles.filter}>
        <Segmented<'OPEN' | 'IN_PROGRESS' | 'CLOSED'>
          label={t('users.member.missionStatus')}
          value={status}
          onChange={setStatus}
          options={(['OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((value) => ({
            value,
            label: t(`missionStatus.${value}`),
          }))}
        />
      </div>
      <QueryState
        query={query}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title={t('users.member.missionsEmpty')} />}
      >
        {(d) => (
          <TableWrap>
            <thead>
              <tr>
                <th>{t('users.member.mission')}</th>
                <th className={cell.hideSm}>{t('users.member.kind')}</th>
                <th className={cell.num}>{t('users.member.budget')}</th>
                <th className={cell.hideSm}>{t('users.member.duration')}</th>
                <th>{t('users.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <a
                      className={cell.title}
                      href={`/mission/${m.id}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {m.title}
                    </a>
                    <small className={cell.sub}>
                      {t('users.member.missionApplications', { count: m.applicationCount })},{' '}
                      {formatAgo(m.createdAt, lang)}
                    </small>
                  </td>
                  <td className={cell.hideSm}>
                    <Pill>{t(`missionKind.${m.kind}`)}</Pill>
                  </td>
                  <td className={cell.num}>
                    {fmt(m.budget.amount, lang)} {m.budget.currency}
                  </td>
                  <td className={cell.hideSm}>
                    {t('users.member.missionDuration', { count: m.durationDays })}
                  </td>
                  <td>
                    <Status tone={MISSION_TONE[m.status]}>{t(`missionStatus.${m.status}`)}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </QueryState>
    </>
  )
}

function Reputation({ username }: { username: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [index, setIndex] = useState(1)
  const query = useQuery(
    (signal) => publicApi.reputation(username, { page: index - 1, size: SIZE }, { signal }),
    [username, index],
  )
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / SIZE)) : 1
  return (
    <QueryState
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={<EmptyState title={t('users.member.reputationEmpty')} />}
    >
      {(d) => (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th>{t('users.member.event')}</th>
                <th className={cell.num}>{t('users.member.points')}</th>
                <th className={cell.right}>{t('users.member.date')}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((e, i) => (
                <tr key={`${e.createdAt}-${i}`}>
                  <td>{t(`reputationReasons.${e.reason}`)}</td>
                  <td
                    className={cell.num}
                    style={{
                      color: e.delta < 0 ? 'var(--crit-text)' : 'var(--good-text)',
                      fontWeight: 600,
                    }}
                  >
                    {e.delta > 0 ? '+' : ''}
                    {e.delta}
                  </td>
                  <td className={`${cell.right} ${cell.muted}`}>{formatDate(e.createdAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {pages > 1 && (
            <Pager summary={t('common.page', { page: index, pages })}>
              <Button size="sm" disabled={index <= 1} onClick={() => setIndex(index - 1)}>
                {t('common.previous')}
              </Button>
              <Button size="sm" disabled={index >= pages} onClick={() => setIndex(index + 1)}>
                {t('common.next')}
              </Button>
            </Pager>
          )}
        </>
      )}
    </QueryState>
  )
}
