import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

import { ignores, typescriptRules } from './base.js';

/** Next.js app: core-web-vitals + TypeScript rules bundled by eslint-config-next. */
export default [ignores, ...nextVitals, ...nextTypescript, typescriptRules, prettier];
