import { useCallback, useState } from 'react'
import { SAMPLE_CONTESTS, SAMPLE_REPORTS } from './sampleReports'
import { STATUS_AFTER_ACTION } from './types'
import type { ContestItem, ContestStatus, ReportAction, ReportItem, ReportStatus } from './types'

export type UndoState = { kind: 'report' | 'contest'; id: number; previous: string; label: string }

export function useReportQueue() {
  const [reports, setReports] = useState<ReportItem[]>(SAMPLE_REPORTS)
  const [contests, setContests] = useState<ContestItem[]>(SAMPLE_CONTESTS)
  const [undo, setUndo] = useState<UndoState | null>(null)

  const applyReport = useCallback((report: ReportItem, action: ReportAction) => {
    setReports((items) =>
      items.map((i) => (i.id === report.id ? { ...i, status: STATUS_AFTER_ACTION[action] } : i)),
    )
    setUndo({ kind: 'report', id: report.id, previous: report.status, label: action })
  }, [])

  const resolveContest = useCallback((contest: ContestItem, next: ContestStatus) => {
    setContests((items) => items.map((i) => (i.id === contest.id ? { ...i, status: next } : i)))
    setUndo({ kind: 'contest', id: contest.id, previous: contest.status, label: next })
  }, [])

  const undoLast = useCallback(() => {
    if (!undo) return
    if (undo.kind === 'report') {
      setReports((items) =>
        items.map((i) => (i.id === undo.id ? { ...i, status: undo.previous as ReportStatus } : i)),
      )
    } else {
      setContests((items) =>
        items.map((i) => (i.id === undo.id ? { ...i, status: undo.previous as ContestStatus } : i)),
      )
    }
    setUndo(null)
  }, [undo])

  const clearUndo = useCallback(() => setUndo(null), [])

  return { reports, contests, undo, applyReport, resolveContest, undoLast, clearUndo }
}
