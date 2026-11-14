import { act, renderHook } from '@testing-library/react'
import { useDeferredActions } from './useDeferredActions'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test("l'action part après le délai et l'élément reste masqué en attendant", async () => {
  const send = vi.fn().mockResolvedValue(undefined)
  const settled = vi.fn()
  const { result } = renderHook(() => useDeferredActions(6000))
  act(() => result.current.schedule(7, send, settled))
  expect(result.current.hidden.has(7)).toBe(true)
  expect(send).not.toHaveBeenCalled()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000)
  })
  expect(send).toHaveBeenCalledTimes(1)
  expect(settled).toHaveBeenCalledWith()
})

test("annuler avant le délai n'envoie rien et réaffiche l'élément", async () => {
  const send = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() => useDeferredActions(6000))
  act(() => result.current.schedule(7, send, vi.fn()))
  act(() => result.current.cancel(7))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000)
  })
  expect(send).not.toHaveBeenCalled()
  expect(result.current.hidden.has(7)).toBe(false)
})

test("un échec réaffiche l'élément et remonte l'erreur", async () => {
  const failure = new Error('refusé')
  const settled = vi.fn()
  const { result } = renderHook(() => useDeferredActions(1000))
  act(() => result.current.schedule(3, () => Promise.reject(failure), settled))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
  expect(settled).toHaveBeenCalledWith(failure)
  expect(result.current.hidden.has(3)).toBe(false)
})

test("fermer l'écran envoie les actions encore en attente", () => {
  const send = vi.fn().mockResolvedValue(undefined)
  const { result, unmount } = renderHook(() => useDeferredActions(6000))
  act(() => result.current.schedule(9, send, vi.fn()))
  unmount()
  expect(send).toHaveBeenCalledTimes(1)
})
