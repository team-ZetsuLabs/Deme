import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';
import { tokenize } from './highlight';

afterEach(cleanup);

describe('tokenize', () => {
  it('reconnaît mots-clés, chaînes, commentaires et nombres sans rien perdre', () => {
    const code = 'const total = 42; // en FCFA\nreturn "ok";';
    const tokens = tokenize(code);
    expect(tokens.map((t) => t.text).join('')).toBe(code);
    expect(tokens).toContainEqual({ type: 'keyword', text: 'const' });
    expect(tokens).toContainEqual({ type: 'number', text: '42' });
    expect(tokens).toContainEqual({ type: 'comment', text: '// en FCFA' });
    expect(tokens).toContainEqual({ type: 'string', text: '"ok"' });
  });
});

describe('CodeBlock', () => {
  it('affiche un code piégé comme du texte', () => {
    const { container } = render(
      <CodeBlock code={'<img src=x onerror=alert(1)><script>alert(1)</script>'} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});
