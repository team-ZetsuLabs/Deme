import { act, renderHook, waitFor } from '@testing-library/react'
import { useQuery } from './useQuery'

test('ne garde pas le résultat d’une requête annulée', async () => {
  const resolvers: Array<(value: string) => void> = []
  const fetcher = (signal: AbortSignal) =>
    new Promise<string>((resolve) => {
      resolvers.push((value) => resolve(signal.aborted ? 'périmé' : value))
    })
  const { result, rerender } = renderHook(({ id }) => useQuery(fetcher, [id]), {
    initialProps: { id: 1 },
  })
  rerender({ id: 2 })
  await act(async () => {
    resolvers[1]('récent')
    resolvers[0]('ancien')
  })
  await waitFor(() => expect(result.current.data).toBe('récent'))
  expect(result.current.loading).toBe(false)
})

test('expose l’erreur et permet de réessayer', async () => {
  let attempt = 0
  const fetcher = async () => {
    attempt += 1
    if (attempt === 1) throw new Error('panne')
    return 'ok'
  }
  const { result } = renderHook(() => useQuery(fetcher, []))
  await waitFor(() => expect(result.current.error).toBeInstanceOf(Error))
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.data).toBe('ok'))
  expect(result.current.error).toBeUndefined()
})
