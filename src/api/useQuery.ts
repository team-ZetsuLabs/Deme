import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type State<T> = { key: string; data?: T; error?: unknown }

export type Query<T> = {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Charge des données au montage et à chaque changement de `deps`. Chaque appel gère trois états
 * (chargement, erreur, données) ; la requête précédente est annulée quand les paramètres changent.
 */
export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): Query<T> {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<State<T>>({ key: '' })
  const depsKey = JSON.stringify(deps)
  const key = `${depsKey}#${version}`

  const latest = useRef(fetcher)
  useEffect(() => {
    latest.current = fetcher
  })

  useEffect(() => {
    const controller = new AbortController()
    latest
      .current(controller.signal)
      .then((data) => setState({ key, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState((previous) => ({ key, data: previous.data, error }))
      })
    return () => controller.abort()
  }, [key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return useMemo(
    () => ({
      data: state.data,
      error: state.key === key ? state.error : undefined,
      loading: state.key !== key,
      reload,
    }),
    [state, key, reload],
  )
}
