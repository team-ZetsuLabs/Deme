import { createContext, useContext, useEffect } from 'react'

export type Crumb = { label: string; to?: string }
type SetCrumbs = (crumbs: Crumb[]) => void

export const CrumbsContext = createContext<SetCrumbs>(() => {})

/** Déclare le fil d'Ariane de la page courante et le titre du document. */
export function useCrumbs(crumbs: Crumb[]) {
  const set = useContext(CrumbsContext)
  const key = JSON.stringify(crumbs)
  useEffect(() => {
    const parsed = JSON.parse(key) as Crumb[]
    set(parsed)
    const last = parsed.at(-1)
    if (last) document.title = `${last.label} · Dɛmɛ Admin`
  }, [key, set])
}
