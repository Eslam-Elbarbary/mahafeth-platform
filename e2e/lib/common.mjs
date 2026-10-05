/** Shared config and helpers for the e2e scripts. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const E2E_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
export const ADMIN = process.env.E2E_ADMIN_URL ?? 'http://localhost:5173';
export const API = process.env.E2E_API_URL ?? 'http://localhost:4000/api/v1';
export const TOKEN_KEY = 'mahafeth.admin.token';

export const shotsDir = (suite) => join(E2E_ROOT, '.artifacts', suite);

function backendEnv() {
  const file = join(E2E_ROOT, '..', 'apps', 'backend', '.env');
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

const env = backendEnv();
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? env.SEED_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? env.SEED_ADMIN_PASSWORD;

let step = 0;
export const pass = (message) => console.log(`  ok ${++step} - ${message}`);
export const passed = () => step;

export function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

export async function api(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, json };
}

/** Signs in with the seed admin (or E2E_ADMIN_*) and returns the bearer token. */
export async function adminToken() {
  assert(EMAIL && PASSWORD, 'admin credentials (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)');
  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });
  assert(login.status === 200, `admin login (HTTP ${login.status})`);
  return login.json.data.accessToken;
}

export const js = (value) => JSON.stringify(value);

/** Polls an async predicate (API state after a UI action). */
export async function until(predicate, message, timeoutMs = 10_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Assertion failed: ${message}`);
}

/** Runs a suite and reports like TAP; sets a non-zero exit code on failure. */
export function run(main) {
  main().catch((error) => {
    console.error(`\nnot ok - ${error.message}`);
    process.exitCode = 1;
  });
}
