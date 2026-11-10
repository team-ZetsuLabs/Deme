import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import i18n from './i18n'

const at = (path: string) => window.history.pushState({}, '', `${import.meta.env.BASE_URL}${path}`)

const page = { items: [], page: 0, size: 20, total: 0 }
const member = (role: string, level = 'MEMBER') => ({
  id: 1,
  username: 'equipe',
  displayName: 'Équipe Dɛmɛ',
  language: 'fr',
  visibleToRecruiters: false,
  role,
  reputation: 10,
  level,
  technologies: [],
  onboardingCompleted: true,
  createdAt: '2026-10-01T10:00:00Z',
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Faux back-end : session ouverte ou non, selon le membre fourni au moment de la connexion. */
function mockBackend(loggedInAs: ReturnType<typeof member>) {
  let session = false
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace('/api/v1', '').split('?')[0]
    if (path === '/auth/csrf') return json({ headerName: 'X-XSRF-TOKEN', token: 't' })
    if (path === '/auth/me')
      return session
        ? json(loggedInAs)
        : json({ code: 'UNAUTHENTICATED', message: 'Connexion requise' }, 401)
    if (path === '/auth/login' && init?.method === 'POST') {
      session = true
      return json(loggedInAs)
    }
    if (path === '/auth/logout') return new Response(null, { status: 204 })
    return json(page)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function signIn() {
  await userEvent.type(await screen.findByLabelText('Adresse email'), 'equipe@deme.dev')
  await userEvent.type(screen.getByLabelText('Mot de passe'), 'un-mot-de-passe')
  await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))
}

afterEach(async () => {
  vi.unstubAllGlobals()
  await i18n.changeLanguage('fr')
  localStorage.clear()
})

test('sans session, on arrive sur la connexion', async () => {
  mockBackend(member('ADMIN'))
  at('signalements')
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Bon retour !' })).toBeInTheDocument()
})

test("la connexion ouvre le tableau de bord d'un administrateur", async () => {
  const fetchMock = mockBackend(member('ADMIN'))
  at('connexion')
  render(<App />)
  await signIn()
  expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Signalements/ })).toBeInTheDocument()
  const login = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/login'))
  expect(JSON.parse(String(login?.[1]?.body))).toEqual({
    email: 'equipe@deme.dev',
    password: 'un-mot-de-passe',
  })
  expect((login?.[1]?.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('t')
})

test("un simple membre n'a pas accès à l'administration", async () => {
  mockBackend(member('MEMBER'))
  at('connexion')
  render(<App />)
  await signIn()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    "Ce compte n'a pas accès à l'administration.",
  )
})

test("un Référent sans rôle d'équipe n'a que la vue Référent", async () => {
  mockBackend(member('MEMBER', 'REFERENT'))
  at('connexion')
  render(<App />)
  await signIn()
  expect(await screen.findByRole('heading', { name: 'Vue Référent' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Utilisateurs/ })).not.toBeInTheDocument()
})

test('les champs invalides sont signalés avant tout appel', async () => {
  const fetchMock = mockBackend(member('ADMIN'))
  at('connexion')
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: 'Se connecter' }))
  expect(screen.getByText('Entrez une adresse email valide.')).toBeInTheDocument()
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/auth/login'))).toBe(false)
})

test('le mot de passe peut être affiché puis masqué', async () => {
  mockBackend(member('ADMIN'))
  at('connexion')
  render(<App />)
  const field = await screen.findByLabelText('Mot de passe')
  expect(field).toHaveAttribute('type', 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
  expect(field).toHaveAttribute('type', 'text')
  await userEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }))
  expect(field).toHaveAttribute('type', 'password')
})
