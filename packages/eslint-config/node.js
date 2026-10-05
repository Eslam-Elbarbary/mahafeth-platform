import globals from 'globals';
import tseslint from 'typescript-eslint';

import base from './base.js';

/** Node.js services (backend). */
export default tseslint.config(...base, {
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 2023,
    globals: globals.node,
  },
});
