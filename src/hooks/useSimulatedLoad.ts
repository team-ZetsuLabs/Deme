import { useEffect, useState } from 'react'

/** Simule le chargement le temps que les écrans soient branchés sur l'API (SOCLE-2). */
export function useSimulatedLoad(delay = 400): boolean {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(id)
  }, [delay])
  return loading
}
