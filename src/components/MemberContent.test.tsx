import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemberContent } from './MemberContent';

afterEach(cleanup);

const renderHtml = (html: string) => render(<MemberContent html={html} />).container;

describe('MemberContent', () => {
  it('garde la mise en forme autorisée', () => {
    const el = renderHtml(
      '<p>Préfixez par <code>Bearer</code></p><pre><code>const a = 1;</code></pre>',
    );
    expect(el.querySelector('p code')?.textContent).toBe('Bearer');
    expect(el.querySelector('pre code')?.textContent).toBe('const a = 1;');
  });

  it('retire les scripts', () => {
    const el = renderHtml('<p>Bonjour</p><script>alert(1)</script>');
    expect(el.querySelector('script')).toBeNull();
    expect(el.innerHTML).not.toContain('alert');
  });

  it('retire les attributs onerror et les balises non autorisées', () => {
    const el = renderHtml('<img src=x onerror=alert(1)><p onclick="alert(1)">texte</p>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.innerHTML).not.toContain('onerror');
    expect(el.innerHTML).not.toContain('onclick');
  });

  it('refuse les liens javascript: et garde les liens https', () => {
    const el = renderHtml(
      '<a href="javascript:alert(1)">piège</a><a href="https://docs.spring.io">doc</a>',
    );
    const [trap, doc] = Array.from(el.querySelectorAll('a'));
    expect(trap.getAttribute('href')).toBeNull();
    expect(doc.getAttribute('href')).toBe('https://docs.spring.io');
    expect(doc.getAttribute('rel')).toBe('noopener noreferrer nofollow');
  });
});
