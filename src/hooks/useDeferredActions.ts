import { useCallback, useEffect, useRef, useState } from 'react'

type Entry = { timer: ReturnType<typeof setTimeout>; send: () => Promise<unknown> }

/**
 * Actions envoyées à l'API après un délai (annulation pendant 6 secondes, côté front avant l'envoi).
 * Les éléments en attente sont masqués ; ceux qui restent à l'écran sont envoyés quand l'écran se ferme.
 */
export function useDeferredActions(delay: number) {
  const entries = useRef(new Map<number, Entry>())
  const [hidden, setHidden] = useState<ReadonlySet<number>>(new Set())

  const unhide = useCallback((id: number) => {
    setHidden((previous) => {
      const next = new Set(previous)
      next.delete(id)
      return next
    })
  }, [])

  const schedule = useCallback(
    (id: number, send: () => Promise<unknown>, onSettled: (error?: unknown) => void) => {
      setHidden((previous) => new Set(previous).add(id))
      const timer = setTimeout(async () => {
        entries.current.delete(id)
        try {
          await send()
          onSettled()
        } catch (error) {
          unhide(id)
          onSettled(error)
        }
      }, delay)
      entries.current.set(id, { timer, send })
    },
    [delay, unhide],
  )

  const cancel = useCallback(
    (id: number) => {
      const entry = entries.current.get(id)
      if (entry) clearTimeout(entry.timer)
      entries.current.delete(id)
      unhide(id)
    },
    [unhide],
  )

  useEffect(() => {
    const pending = entries.current
    return () => {
      for (const entry of pending.values()) {
        clearTimeout(entry.timer)
        void entry.send().catch(() => {})
      }
      pending.clear()
    }
  }, [])

  return { hidden, schedule, cancel }
}
