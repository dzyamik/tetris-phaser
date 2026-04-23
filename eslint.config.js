// eslint.config.js — ESLint 9 flat config
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['docs/**', 'node_modules/**', 'dist/**', 'dev-dist/**', 'coverage/**', 'tools/**'],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // CORE PURITY: src/core/** must not import Phaser or use browser globals.
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phaser',
              message:
                'src/core/** must be engine-agnostic. Do not import Phaser in core. See docs-dev/ARCHITECTURE.md.',
            },
          ],
          patterns: ['phaser/*'],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'No browser globals in core.' },
        { name: 'document', message: 'No browser globals in core.' },
        { name: 'localStorage', message: 'No browser globals in core.' },
        { name: 'sessionStorage', message: 'No browser globals in core.' },
        { name: 'navigator', message: 'No browser globals in core.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            'Do not use Math.random() in core — use the seeded RNG in src/core/rng.ts.',
        },
      ],
    },
  },
  prettier,
];
