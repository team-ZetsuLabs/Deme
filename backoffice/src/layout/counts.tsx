import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { adminApi, playtestApi } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'

type Counts = { reports: number; jobs: number; proposals: number; playtests: number }
type CountsContextValue = Counts & { refresh: () => void }

const CountsContext = createContext<CountsContextValue>({
  reports: 0,
  jobs: 0,
  proposals: 0,
  playtests: 0,
  refresh: () => {},
})

/** Compteurs de la barre latérale (à traiter), rechargés après chaque décision. */
export function CountsProvider({ children }: { children: ReactNode }) {
  const { access } = useAuth()
  const [counts, setCounts] = useState<Counts>({ reports: 0, jobs: 0, proposals: 0, playtests: 0 })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (access !== 'staff') return
    const controller = new AbortController()
    const options = { signal: controller.signal }
    Promise.all([
      adminApi.listCases({ status: 'OPEN', size: 1 }, options),
      adminApi.listJobs({ status: 'PENDING', size: 1 }, options),
      adminApi.listProposals({ status: 'PENDING', size: 1 }, options),
      playtestApi.list({ status: 'PENDING_REVIEW', size: 1 }, options),
    ])
      .then(([cases, jobs, proposals, playtests]) =>
        setCounts({
          reports: cases.total,
          jobs: jobs.total,
          proposals: proposals.total,
          playtests: playtests.total,
        }),
      )
      .catch(() => {})
    return () => controller.abort()
  }, [access, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const value = useMemo(() => ({ ...counts, refresh }), [counts, refresh])
  return <CountsContext.Provider value={value}>{children}</CountsContext.Provider>
}

export function useCounts(): CountsContextValue {
  return useContext(CountsContext)
}
