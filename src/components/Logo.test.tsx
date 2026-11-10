import { render, screen } from '@testing-library/react'
import Logo from './Logo'

test('le logo a le nom du projet comme nom accessible', () => {
  render(<Logo />)
  expect(screen.getByRole('img', { name: 'Dɛmɛ' })).toBeInTheDocument()
})

test('la version symbole garde les proportions du D compact', () => {
  render(<Logo variant="symbol" height={256} />)
  const svg = screen.getByRole('img', { name: 'Dɛmɛ' })
  expect(svg).toHaveAttribute('viewBox', '0 0 184 256')
  expect(svg).toHaveAttribute('width', '184')
})
