export type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'plain';
export type Token = { type: TokenType; text: string };

// Mots-clés courants de JavaScript, TypeScript, Java, PHP, Dart, Python et Kotlin.
const KEYWORDS = new Set(
  (
    'abstract async await break case catch class const continue def default do else enum export ' +
    'extends final finally fn for from fun function if implements import in instanceof interface ' +
    'let new null package private protected public return static super switch this throw throws ' +
    'true false try typeof val var void while with yield echo elif except lambda pass self None ' +
    'True False'
  ).split(' '),
);

const PATTERN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$@][\w$]*)/g;

/**
 * Découpe du code brut en morceaux typés, affichés ensuite comme texte par React.
 * Aucun HTML n'est produit : un code piégé reste du texte (voir CLAUDE.md, sécurité).
 */
export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  const push = (type: TokenType, text: string) => {
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) prev.text += text;
    else tokens.push({ type, text });
  };

  for (const match of code.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) push('plain', code.slice(last, index));
    const [text, comment, string, number, word] = match;
    if (comment) push('comment', text);
    else if (string) push('string', text);
    else if (number) push('number', text);
    else if (word && (KEYWORDS.has(word) || word.startsWith('@'))) push('keyword', text);
    else push('plain', text);
    last = index + text.length;
  }
  if (last < code.length) push('plain', code.slice(last));
  return tokens;
}
