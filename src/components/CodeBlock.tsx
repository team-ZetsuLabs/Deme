import { useMemo } from 'react';
import { tokenize } from './highlight';
import styles from './CodeBlock.module.css';

export type CodeBlockProps = {
  /** Code brut tel que saisi par le membre. */
  code: string;
};

/** Code coloré côté client à partir du texte brut (cahier, point 3 de la revue des maquettes). */
export function CodeBlock({ code }: CodeBlockProps) {
  const tokens = useMemo(() => tokenize(code), [code]);
  return (
    <pre className={styles.code} tabIndex={0}>
      <code>
        {tokens.map((token, i) =>
          token.type === 'plain' ? (
            token.text
          ) : (
            <span key={i} className={styles[token.type]}>
              {token.text}
            </span>
          ),
        )}
      </code>
    </pre>
  );
}
