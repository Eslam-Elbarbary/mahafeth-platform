import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/coverage/**',
    '**/generated/**',
    '**/next-env.d.ts',
  ],
};

export const typescriptRules = {
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  },
};

/** Language-agnostic TypeScript baseline shared by every workspace. */
export default tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  typescriptRules,
  prettier,
);
