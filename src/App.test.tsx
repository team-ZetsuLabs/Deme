import { render, screen } from '@testing-library/react'
import App from './App'
import './i18n'

test('affiche la page de connexion', async () => {
  window.history.pushState({}, '', `${import.meta.env.BASE_URL}login`)
  render(<App />)
  expect(await screen.findByRole('heading', { name: "Connexion à l'équipe" })).toBeInTheDocument()
})

test("redirige l'accueil vers les signalements", async () => {
  window.history.pushState({}, '', import.meta.env.BASE_URL)
  render(<App />)
  expect(
    await screen.findByRole('heading', { name: 'Signalements et contestations' }),
  ).toBeInTheDocument()
})

test('une adresse inconnue affiche la page introuvable', async () => {
  window.history.pushState({}, '', `${import.meta.env.BASE_URL}nimporte-quoi`)
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
})
