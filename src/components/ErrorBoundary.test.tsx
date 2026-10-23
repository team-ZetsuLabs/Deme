import { render, screen } from '@testing-library/react'
import '../i18n'
import ErrorBoundary from './ErrorBoundary'

function Broken(): never {
  throw new Error('boom')
}

test("affiche la page d'erreur quand un écran plante", () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue')
  expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument()
  spy.mockRestore()
})
