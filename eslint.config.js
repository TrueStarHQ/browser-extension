import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelteEslint from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// Shared rules that apply to both .ts and .svelte files
const sharedRules = {
  ...typescriptEslint.configs.recommended.rules,
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  'no-console': 'off',
  'prefer-const': 'error',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
};

export default [
  {
    ignores: ['dist', 'node_modules', '.yarn'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.app.json',
      },
      globals: {
        browser: true,
        es2022: true,
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: sharedRules,
  },
  {
    files: ['src/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        project: './tsconfig.app.json',
        extraFileExtensions: ['.svelte'],
      },
    },
    plugins: {
      svelte: svelteEslint,
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...sharedRules,
      ...svelteEslint.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
];
