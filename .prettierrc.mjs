import base from '@mahafeth/prettier-config';

/** @type {import('prettier').Config} */
export default {
  ...base,
  overrides: [
    {
      files: 'apps/web/**',
      options: { tailwindStylesheet: './apps/web/src/app/globals.css' },
    },
    {
      files: 'apps/admin/**',
      options: { tailwindStylesheet: './apps/admin/src/index.css' },
    },
  ],
};
