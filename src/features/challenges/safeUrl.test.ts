import { safeHttpUrl } from './safeUrl'

describe('safeHttpUrl', () => {
  it('accepte https et http', () => {
    expect(safeHttpUrl('https://github.com/aminata/defi')).toBe('https://github.com/aminata/defi')
    expect(safeHttpUrl('http://example.com/')).toBe('http://example.com/')
  })

  it('refuse javascript: et les valeurs invalides', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHttpUrl('pas une url')).toBeNull()
  })
})
