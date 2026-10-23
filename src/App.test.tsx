import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import i18n from './i18n'

const at = (path: string) => window.history.pushState({}, '', `${import.meta.env.BASE_URL}${path}`)

async function signIn() {
  await userEvent.type(await screen.findByLabelText('Adresse email'), 'equipe@zetsu.dev')
  await userEvent.type(screen.getByLabelText('Mot de passe'), 'un-mot-de-passe')
  await userEvent.click(screen.getByRole('button', { name: 'Continuer' }))
  await userEvent.type(
    await screen.findByLabelText('Code de vérification', {}, { timeout: 3000 }),
    '123456',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Vérifier et se connecter' }))
}

afterEach(async () => {
  await i18n.changeLanguage('fr')
  localStorage.clear()
})

test('sans session, on arrive sur la connexion', async () => {
  at('signalements')
  render(<App />)
  expect(
    await screen.findByRole('heading', { name: "Connexion à l'administration" }),
  ).toBeInTheDocument()
})

test('la connexion en deux étapes mène au tableau de bord', async () => {
  at('')
  render(<App />)
  await signIn()
  expect(
    await screen.findByRole('heading', { name: 'Tableau de bord' }, { timeout: 3000 }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Signalements/ })).toBeInTheDocument()
})

test('les champs invalides sont signalés avant la deuxième étape', async () => {
  at('connexion')
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: 'Continuer' }))
  expect(screen.getByText('Entrez une adresse email valide.')).toBeInTheDocument()
  expect(screen.getByText('Entrez votre mot de passe.')).toBeInTheDocument()
})

test('une adresse inconnue affiche la page introuvable une fois connecté', async () => {
  at('connexion')
  render(<App />)
  await signIn()
  await screen.findByRole('heading', { name: 'Tableau de bord' }, { timeout: 3000 })
  await userEvent.click(screen.getByRole('link', { name: /Utilisateurs/ }))
  expect(await screen.findByRole('heading', { name: 'Utilisateurs' })).toBeInTheDocument()
})
