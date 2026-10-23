import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../hooks/useTheme'
import i18n from '../i18n'
import Preferences from './Preferences'

function setup() {
  render(
    <ThemeProvider>
      <Preferences />
    </ThemeProvider>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('fr')
  localStorage.clear()
})

test('le thème clair est celui par défaut, le sombre se choisit et se mémorise', async () => {
  setup()
  expect(screen.getByRole('button', { name: 'Clair' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'Sombre' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('zetsu-bo-theme')).toBe('dark')
})

test("la langue bascule entre français et anglais et met à jour l'attribut lang", async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'English' }))
  expect(i18n.language).toBe('en')
  expect(document.documentElement.lang).toBe('en')
  expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
  expect(localStorage.getItem('zetsu-bo-lang')).toBe('en')
})
