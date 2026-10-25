// Code rules for src/app (docs/normas_codigo.md). They are enforced: `npm run lint` and the CI fail on any error.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['src/legado/**', 'src/generated/**', 'src/**/*.js', 'herramientas/**', 'app.js', 'manual/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['src/app/**/*.ts'],
    languageOptions: { parserOptions: { project: './tsconfig.app.json', tsconfigRootDir: import.meta.dirname } },
    rules: {
      // Names: camelCase for values and functions, PascalCase for types, UPPER_CASE only for constants
      '@typescript-eslint/naming-convention': ['error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'forbid' },
        { selector: 'variable', modifiers: ['const', 'global'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        { selector: ['objectLiteralProperty', 'typeProperty'], format: null },
        { selector: 'import', format: ['camelCase', 'PascalCase'] }],
      // No cryptic abbreviations (pd, td, rn…): identifiers say what they are
      // Property names are not checked: some come from outside (database payloads like { p }, legacy dialogs like { k, t })
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'x', 'y', 't', '_'], properties: 'never' }],
      // Small units: one responsibility per file and per function
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'complexity': ['error', 12],
      // Safety
      'eqeqeq': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-globals': ['error', { name: 'event', message: 'Use the event parameter.' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // HTML is built with template literals: numbers inside them are expected
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Legacy names (TT, ES_MEDICO, KV_INI…) are declared as they are; they disappear when their piece is migrated.
    // Untyped legacy calls (rpcCache) are typed by the caller: the type parameter is only in the result
    files: ['src/app/legacy/*globals.d.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off', '@typescript-eslint/no-unnecessary-type-parameters': 'off', 'id-length': 'off' },
  },
  {
    // Generated from the database schema (delcos-qa/pruebas/herramientas/contrato_api.js): one entry per SQL function, as long as it takes
    files: ['src/app/api/contract.ts'],
    rules: { 'max-lines': 'off' },
  },
);
