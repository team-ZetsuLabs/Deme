import { render, screen } from '@testing-library/react'
import App from './App'
import './i18n'

test("affiche le titre de l'accueil", async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Back office Zetsu' })).toBeInTheDocument()
})
