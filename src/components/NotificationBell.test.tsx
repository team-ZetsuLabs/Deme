import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import NotificationBell from './NotificationBell'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const notification = (id: number, read: boolean) => ({
  id,
  type: 'PLAYTEST_NEW_CAMPAIGN',
  read,
  actor: null,
  target: { type: 'PLAYTEST', id: 9, title: 'Tontine Cash' },
  outcome: null,
  createdAt: new Date().toISOString(),
})

function stub() {
  let unread = 2
  const calls: Array<{ url: string; method: string; body?: string }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace('/api/v1', '').split('?')[0]
      calls.push({
        url: path,
        method: init?.method ?? 'GET',
        body: init?.body as string | undefined,
      })
      if (path === '/auth/csrf') return json({ headerName: 'X-XSRF-TOKEN', token: 't' })
      if (path === '/notifications/unread-count') return json({ count: unread })
      if (path === '/notifications/read') {
        unread = 0
        return json({ count: 0 })
      }
      return json({
        items: [notification(2, false), notification(1, true)],
        page: 0,
        size: 20,
        total: 2,
      })
    }),
  )
  return calls
}

afterEach(() => vi.unstubAllGlobals())

test('affiche le nombre de non-lues sur la cloche', async () => {
  stub()
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  )
  expect(
    await screen.findByRole('button', { name: 'Notifications, 2 non lues' }),
  ).toBeInTheDocument()
})

test('liste les notifications traduites et marque tout comme lu', async () => {
  const calls = stub()
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 2 non lues' }))
  expect((await screen.findAllByText(/Nouvelle campagne de test : « Tontine Cash »/)).length).toBe(
    2,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Tout marquer comme lu' }))
  expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  const read = calls.find((c) => c.url === '/notifications/read')
  expect(read?.method).toBe('POST')
  expect(JSON.parse(read?.body ?? 'null')).toEqual({})
})

test('en anglais, le texte suit la langue', async () => {
  stub()
  await i18n.changeLanguage('en')
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Notifications, 2 unread' }))
  expect((await screen.findAllByText(/New test campaign: “Tontine Cash”/)).length).toBe(2)
  await i18n.changeLanguage('fr')
})
