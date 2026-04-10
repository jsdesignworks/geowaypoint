import eslint from '@eslint/js';

/** Root ESLint flat config — keeps `npm run lint` safe for mixed ESLint 8 (Next) + root tooling. */
export default [
  eslint.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/out/**',
      'apps/web/**',
      'apps/embed/**',
    ],
  },
];
