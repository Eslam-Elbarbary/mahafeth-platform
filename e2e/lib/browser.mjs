/**
 * Minimal Chrome DevTools Protocol driver for the locally installed Edge/Chrome — no browser
 * download needed. Requires Node >= 22 (global `WebSocket`).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.E2E_BROWSER,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** `E2E_BROWSER_ARGS`: a JSON array (for values with spaces) or space-separated flags. */
const extraArgs = (value = '') =>
  value.trim().startsWith('[') ? JSON.parse(value) : value.split(' ').filter(Boolean);

async function waitForJson(url, timeoutMs = 15_000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* browser still starting */
    }
    await sleep(200);
  }
  throw new Error(`Browser did not expose ${url}`);
}

export async function launch({ port = 9334, width = 1440, height = 1000 } = {}) {
  const binary = CANDIDATES.find((path) => existsSync(path));
  if (!binary) throw new Error('No Edge/Chrome found; set E2E_BROWSER to the executable path.');

  const profile = mkdtempSync(join(tmpdir(), 'mhf-e2e-'));
  const proc = spawn(
    binary,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      // e.g. host mapping and a self-signed certificate when testing a production-like Nginx.
      ...extraArgs(process.env.E2E_BROWSER_ARGS),
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const listener of listeners) listener(msg);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const consoleErrors = [];
  listeners.add((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails?.exception?.description ?? 'exception');
    }
  });

  /** Evaluates an expression (or an async IIFE) in the page and returns its JSON value. */
  async function evaluate(expression) {
    const { result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  }

  async function waitFor(expression, { timeoutMs = 15_000, label = expression } = {}) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      try {
        if (await evaluate(expression)) return;
      } catch {
        /* page navigating */
      }
      await sleep(150);
    }
    throw new Error(`Timed out waiting for: ${label}`);
  }

  async function goto(url, settleMs = 500) {
    const loaded = new Promise((resolve) => {
      const onLoad = (msg) => {
        if (msg.method === 'Page.loadEventFired') {
          listeners.delete(onLoad);
          resolve();
        }
      };
      listeners.add(onLoad);
    });
    await send('Page.navigate', { url });
    await Promise.race([loaded, sleep(30_000)]);
    await sleep(settleMs);
  }

  async function screenshot(path) {
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, Buffer.from(data, 'base64'));
  }

  async function close() {
    try {
      await send('Browser.close');
    } catch {
      /* already gone */
    }
    ws.close();
    proc.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  return { send, evaluate, waitFor, goto, screenshot, close, consoleErrors };
}

/**
 * In-page helpers (inject with `evaluate(DOM_HELPERS)`): set React-controlled inputs and click.
 */
export const DOM_HELPERS = `
  window.__set = (el, value) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  };
  true;
`;
