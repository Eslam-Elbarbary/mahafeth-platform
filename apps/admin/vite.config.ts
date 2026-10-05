import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * "View on site" links bake VITE_SITE_URL into the bundle, so a production build refuses a missing,
 * `http://` or localhost value. A production build on a developer machine opts out with
 * ALLOW_LOCAL_URLS=true.
 */
function checkProductionEnv(env: Record<string, string>) {
  if (env.ALLOW_LOCAL_URLS === 'true') return;
  const value = env.VITE_SITE_URL;
  if (!value) throw new Error('Production configuration: VITE_SITE_URL is required');
  if (!value.startsWith('https://') || LOCAL_HOSTS.has(new URL(value).hostname)) {
    throw new Error(`Production configuration: VITE_SITE_URL must be the public https URL (got ${value})`);
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (command === 'build' && mode === 'production') checkProductionEnv(env);
  const backend = {
    target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000',
    changeOrigin: true,
  };
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: { '/api': backend, '/uploads': backend },
    },
  };
});
