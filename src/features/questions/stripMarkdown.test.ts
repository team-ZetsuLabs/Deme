import { describe, expect, it } from 'vitest';
import { stripMarkdown } from './stripMarkdown';

describe('stripMarkdown', () => {
  it('retire la mise en forme et garde le texte', () => {
    const md = '# Titre\n\nVoici un **gras**, un [lien](https://x.fr) et du `code`.';
    expect(stripMarkdown(md)).toBe('Titre Voici un gras, un lien et du code.');
  });

  it('enlève les blocs de code', () => {
    const md = 'Avant\n```js\nconst a = 1;\n```\naprès';
    expect(stripMarkdown(md)).toBe('Avant après');
  });

  it('tronque et ajoute une ellipse', () => {
    const out = stripMarkdown('a'.repeat(200), 10);
    expect(out).toBe(`${'a'.repeat(10)}…`);
  });
});
