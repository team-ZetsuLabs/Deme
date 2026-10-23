import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../hooks/useTheme'
import i18n from '../i18n'
import { LanguageSwitch, ThemeToggle } from './Preferences'

function setup() {
  render(
    <ThemeProvider>
      <ThemeToggle />
      <LanguageSwitch />
    </ThemeProvider>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('fr')
  localStorage.clear()
})

test('le thème clair est celui par défaut, le sombre se choisit et se mémorise', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'Passer en mode sombre' }))
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('zetsu-bo-theme')).toBe('dark')
  expect(screen.getByRole('button', { name: 'Passer en mode clair' })).toBeInTheDocument()
})

test("la langue bascule entre français et anglais et met à jour l'attribut lang", async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: 'EN' }))
  expect(i18n.language).toBe('en')
  expect(document.documentElement.lang).toBe('en')
  expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  expect(localStorage.getItem('zetsu-bo-lang')).toBe('en')
})
