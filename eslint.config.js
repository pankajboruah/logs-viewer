import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: ['dist', 'dist-demo', 'dist-types', '**/node_modules/**'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': ['error'],
      'jsx-quotes': ['error', 'prefer-single'],
      'max-len': [
        'error',
        {
          code: 200,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
        },
      ],
      'no-else-return': ['off'],
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'never', prev: '*', next: 'import' },
      ],
      curly: ['warn', 'multi-line'],
      'no-shadow': 'off',
      'no-underscore-dangle': 'off',
      'no-console': ['error', { allow: ['warn', 'error'] }],

      'react/jsx-filename-extension': ['error', { extensions: ['.js', '.tsx'] }],
      'react/prop-types': ['off'],
      'react/no-unescaped-entities': 'warn',
      'react/jsx-one-expression-per-line': 'off',
      'react/require-default-props': ['off'],
      'react/destructuring-assignment': ['off'],
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never' }],

      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off',

      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
    },
  },
  eslintPluginPrettierRecommended
);
