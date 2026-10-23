import { render } from '@testing-library/react'
import MemberContent, { sanitizeMemberHtml } from './MemberContent'

describe('MemberContent', () => {
  it('retire les scripts et les gestionnaires d’événements', () => {
    const out = sanitizeMemberHtml(
      '<p>Bonjour</p><script>alert(1)</script><img src=x onerror=alert(1)>',
    )
    expect(out).toBe('<p>Bonjour</p>')
  })

  it('refuse les liens javascript: et garde les liens https avec rel sécurisé', () => {
    const bad = sanitizeMemberHtml('<a href="javascript:alert(1)">piège</a>')
    expect(bad).not.toContain('javascript:')
    const good = sanitizeMemberHtml('<a href="https://zetsu.example/doc">doc</a>')
    expect(good).toContain('href="https://zetsu.example/doc"')
    expect(good).toContain('rel="noopener noreferrer nofollow"')
  })

  it('retire les attributs de style et les balises hors liste blanche', () => {
    const out = sanitizeMemberHtml(
      '<p style="color:red" onclick="x()">a</p><iframe src="https://x"></iframe>',
    )
    expect(out).toBe('<p>a</p>')
  })

  it('garde le texte et les blocs de code', () => {
    const { container } = render(<MemberContent html="<pre><code>SELECT 1;</code></pre>" />)
    expect(container.querySelector('pre code')?.textContent).toBe('SELECT 1;')
  })

  it("n'exécute rien avec les contenus piégés", () => {
    const spy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<MemberContent html="<script>alert(1)</script><img src=x onerror=alert(1)>" />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
