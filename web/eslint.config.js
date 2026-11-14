import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'docs', 'src/api/api-types.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // Sécurité : le HTML des membres passe uniquement par MemberContent.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Interdit : utilisez le composant MemberContent.',
        },
      ],
      // Les appels réseau passent uniquement par src/api/api.ts.
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Passez par src/api/api.ts.' }],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'axios', message: 'Passez par src/api/api.ts.' }] },
      ],
    },
  },
  {
    // Les déclarations globales (import.meta.env) exigent des interfaces fusionnables.
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    files: ['src/components/MemberContent.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/api/api.ts', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['*.js', 'public/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
