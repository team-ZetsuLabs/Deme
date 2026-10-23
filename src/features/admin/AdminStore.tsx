import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CURRENT_ADMIN_ID,
  DEMO_CONTENTS,
  DEMO_PUBLISHED_JOBS,
  DEMO_REFUSED_JOBS,
  DEMO_SETTINGS,
  DEMO_STAFF,
  DEMO_TAGS,
  buildAudit,
  buildChallenges,
  buildPendingJobs,
  buildReports,
  buildSubmissions,
  buildUsers,
} from './demoData'
import type {
  AuditDetail,
  AuditEntry,
  Challenge,
  ContentItem,
  ContentStatus,
  MemberRole,
  PendingJob,
  PublishedJob,
  RefusedJob,
  Report,
  Settings,
  StaffMember,
  StaffRole,
  Submission,
  Tag,
  User,
} from './types'

export type Undo = () => void

export type ReportOutcome = 'reportIgnored' | 'contentHidden' | 'warningSent' | 'accountSuspended'

export type NewChallenge = {
  title: string
  start: string
  end: string
  points: number
}

export type AdminStore = {
  currentAdmin: StaffMember
  users: User[]
  reports: Report[]
  contents: ContentItem[]
  tags: Tag[]
  pendingJobs: PendingJob[]
  publishedJobs: PublishedJob[]
  refusedJobs: RefusedJob[]
  challenges: Challenge[]
  submissions: Submission[]
  audit: AuditEntry[]
  staff: StaffMember[]
  settings: Settings
  userBy: (id: string) => User | undefined
  staffBy: (id: string) => StaffMember
  resolveReport: (id: number, outcome: ReportOutcome, detail?: AuditDetail) => Undo
  setContentStatus: (id: number, status: ContentStatus) => Undo
  createTag: (name: string) => void
  mergeTag: (from: string, into: string) => void
  deleteTag: (name: string) => void
  setUserRole: (id: string, role: MemberRole) => void
  suspendUsers: (ids: string[], duration: string, reason?: string) => void
  reactivateUser: (id: string) => void
  deleteUser: (id: string) => void
  logPasswordReset: (id: string) => void
  approveJob: (id: number) => void
  refuseJob: (id: number, reason: string) => void
  createChallenge: (challenge: NewChallenge) => void
  gradeSubmission: (id: number, score: number) => void
  rejectSubmission: (id: number) => void
  revokeStaff: (id: string) => void
  inviteStaff: (email: string, role: StaffRole) => void
  updateSettings: (patch: Partial<Settings>) => void
}

const StoreContext = createContext<AdminStore | null>(null)

const OUTCOME_ACTION: Record<ReportOutcome, string> = {
  reportIgnored: 'reportIgnored',
  contentHidden: 'contentHidden',
  warningSent: 'warningSent',
  accountSuspended: 'accountSuspended',
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(buildUsers)
  const [reports, setReports] = useState<Report[]>(() => buildReports(Date.now()))
  const [contents, setContents] = useState<ContentItem[]>(DEMO_CONTENTS)
  const [tags, setTags] = useState<Tag[]>(DEMO_TAGS)
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>(() => buildPendingJobs(Date.now()))
  const [publishedJobs, setPublishedJobs] = useState<PublishedJob[]>(DEMO_PUBLISHED_JOBS)
  const [refusedJobs, setRefusedJobs] = useState<RefusedJob[]>(DEMO_REFUSED_JOBS)
  const [challenges, setChallenges] = useState<Challenge[]>(() => buildChallenges(Date.now()))
  const [submissions, setSubmissions] = useState<Submission[]>(() => buildSubmissions(Date.now()))
  const [audit, setAudit] = useState<AuditEntry[]>(() => buildAudit(Date.now()))
  const [staff, setStaff] = useState<StaffMember[]>(DEMO_STAFF)
  const [settings, setSettings] = useState<Settings>(DEMO_SETTINGS)

  const userBy = useCallback((id: string) => users.find((u) => u.id === id), [users])
  const staffBy = useCallback(
    (id: string) => staff.find((s) => s.id === id) ?? DEMO_STAFF[0],
    [staff],
  )

  const log = useCallback((action: string, target: AuditDetail, detail?: AuditDetail): number => {
    const id = Date.now() + Math.random()
    setAudit((entries) => [
      { id, at: Date.now(), who: CURRENT_ADMIN_ID, action, target, detail },
      ...entries,
    ])
    return id
  }, [])
  const unlog = useCallback(
    (id: number) => setAudit((entries) => entries.filter((e) => e.id !== id)),
    [],
  )

  const patchUsers = useCallback(
    (ids: string[], patch: (u: User) => User) =>
      setUsers((list) => list.map((u) => (ids.includes(u.id) ? patch(u) : u))),
    [],
  )

  const value = useMemo<AdminStore>(() => {
    const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? id

    return {
      currentAdmin: staffBy(CURRENT_ADMIN_ID),
      users,
      reports,
      contents,
      tags,
      pendingJobs,
      publishedJobs,
      refusedJobs,
      challenges,
      submissions,
      audit,
      staff,
      settings,
      userBy,
      staffBy,

      resolveReport(id, outcome, detail) {
        const previous = reports
        const report = reports.find((r) => r.id === id)
        if (!report) return () => {}
        setReports(reports.filter((r) => r.id !== id))
        const logId = log(
          OUTCOME_ACTION[outcome],
          {
            key: 'reportTarget',
            params: { type: `t:reports.types.${report.type}`, name: nameOf(report.author) },
          },
          detail,
        )
        return () => {
          setReports(previous)
          unlog(logId)
        }
      },

      setContentStatus(id, status) {
        const content = contents.find((c) => c.id === id)
        if (!content) return () => {}
        const previous = content.status
        setContents((list) => list.map((c) => (c.id === id ? { ...c, status } : c)))
        const action =
          status === 'hidden'
            ? 'contentHidden'
            : status === 'closed'
              ? 'questionClosed'
              : 'contentRepublished'
        const logId = log(action, content.title)
        return () => {
          setContents((list) => list.map((c) => (c.id === id ? { ...c, status: previous } : c)))
          unlog(logId)
        }
      },

      createTag(name) {
        setTags((list) => [...list, { name, count: 0, synonyms: [], createdDaysAgo: 0 }])
        log('tagCreated', name)
      },

      mergeTag(from, into) {
        const source = tags.find((t) => t.name === from)
        if (!source) return
        setTags((list) =>
          list
            .filter((t) => t.name !== from)
            .map((t) =>
              t.name === into
                ? {
                    ...t,
                    count: t.count + source.count,
                    synonyms: [...t.synonyms, from, ...source.synonyms],
                  }
                : t,
            ),
        )
        log('tagsMerged', `${from} → ${into}`, {
          key: 'questionsMoved',
          params: { count: source.count },
        })
      },

      deleteTag(name) {
        setTags((list) => list.filter((t) => t.name !== name))
        log('tagDeleted', name)
      },

      setUserRole(id, role) {
        patchUsers([id], (u) => ({ ...u, role }))
        log('roleChanged', nameOf(id), {
          key: 'newRole',
          params: { role: `t:users.roles.${role}` },
        })
      },

      suspendUsers(ids, duration, reason) {
        patchUsers(ids, (u) => ({ ...u, status: 'suspended' }))
        if (ids.length === 1) {
          log('accountSuspended', nameOf(ids[0]), {
            key: 'suspension',
            params: { duration: `t:users.durations.${duration}`, reason: reason ?? '' },
          })
        } else {
          log(
            'bulkSuspension',
            { key: 'accounts', params: { count: ids.length } },
            { key: 'duration', params: { duration: `t:users.durations.${duration}` } },
          )
        }
      },

      reactivateUser(id) {
        patchUsers([id], (u) => ({ ...u, status: 'active' }))
        log('accountReactivated', nameOf(id))
      },

      deleteUser(id) {
        const name = nameOf(id)
        setUsers((list) => list.filter((u) => u.id !== id))
        log('accountDeleted', name)
      },

      logPasswordReset(id) {
        log('passwordReset', nameOf(id))
      },

      approveJob(id) {
        const job = pendingJobs.find((j) => j.id === id)
        if (!job) return
        setPendingJobs((list) => list.filter((j) => j.id !== id))
        setPublishedJobs((list) => [
          { title: job.title, company: job.company, daysAgo: 0, applicants: 0 },
          ...list,
        ])
        log('jobApproved', job.title, job.company)
      },

      refuseJob(id, reason) {
        const job = pendingJobs.find((j) => j.id === id)
        if (!job) return
        setPendingJobs((list) => list.filter((j) => j.id !== id))
        setRefusedJobs((list) => [
          { title: job.title, company: job.company, daysAgo: 0, reason },
          ...list,
        ])
        log('jobRefused', job.title, reason)
      },

      createChallenge(challenge) {
        setChallenges((list) => {
          const next: Challenge = {
            id: Date.now(),
            status: 'upcoming',
            submissions: 0,
            ...challenge,
          }
          return [list[0], next, ...list.slice(1)]
        })
        log('challengeCreated', challenge.title, {
          key: 'period',
          params: { from: `d:${challenge.start}`, to: `d:${challenge.end}` },
        })
      },

      gradeSubmission(id, score) {
        const submission = submissions.find((s) => s.id === id)
        if (!submission) return
        setSubmissions((list) =>
          list.map((s) => (s.id === id ? { ...s, status: 'validated', score } : s)),
        )
        patchUsers([submission.user], (u) => ({ ...u, rep: u.rep + 20 }))
        log('submissionValidated', nameOf(submission.user), `${score}/100`)
      },

      rejectSubmission(id) {
        const submission = submissions.find((s) => s.id === id)
        if (!submission) return
        setSubmissions((list) =>
          list.map((s) => (s.id === id ? { ...s, status: 'rejected', note: 'offBrief' } : s)),
        )
        log('submissionRejected', nameOf(submission.user))
      },

      revokeStaff(id) {
        const member = staffBy(id)
        setStaff((list) => list.filter((s) => s.id !== id))
        log('accessRevoked', member.name)
      },

      inviteStaff(email, role) {
        log('invitationSent', email, {
          key: 'staffRole',
          params: { role: `t:settings.roles.${role}` },
        })
      },

      updateSettings(patch) {
        setSettings((s) => ({ ...s, ...patch }))
      },
    }
  }, [
    users,
    reports,
    contents,
    tags,
    pendingJobs,
    publishedJobs,
    refusedJobs,
    challenges,
    submissions,
    audit,
    staff,
    settings,
    userBy,
    staffBy,
    log,
    unlog,
    patchUsers,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAdminStore(): AdminStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useAdminStore doit être utilisé dans AdminStoreProvider')
  return ctx
}
