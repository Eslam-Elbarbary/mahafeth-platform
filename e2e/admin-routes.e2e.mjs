/**
 * Admin routing in a real browser: route guards, sign-in, every module loaded directly (as after a
 * browser refresh, which needs the server's SPA fallback), permission notices, unknown routes and
 * sign-out. Works against `vite dev` or a production build behind Nginx:
 *
 *   E2E_ADMIN_URL=https://admin.mahafeth.com E2E_API_URL=https://admin.mahafeth.com/api/v1 \
 *   pnpm test:e2e:admin-routes
 *
 * Creates one temporary EDITOR and removes it at the end.
 */
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

import { DOM_HELPERS, launch } from './lib/browser.mjs';
import {
  ADMIN,
  adminToken,
  api,
  assert,
  js,
  pass,
  passed,
  run,
  shotsDir,
  TOKEN_KEY,
} from './lib/common.mjs';

const ROUTES = [
  ['/', 'لوحة المعلومات'],
  ['/projects', 'المشاريع'],
  ['/services', 'الخدمات'],
  ['/pages', 'صفحات الموقع'],
  ['/media', 'مكتبة الوسائط'],
  ['/team', 'فريق القيادة'],
  ['/partners', 'الشركاء'],
  ['/leads', 'طلبات الاهتمام'],
  ['/settings', 'إعدادات الموقع'],
  ['/settings/content', 'المحتوى العام'],
  ['/users', 'المستخدمون'],
  ['/audit-logs', 'سجل التغييرات'],
];
const FORBIDDEN = 'لا تملك صلاحية الوصول إلى هذه الصفحة';
const NOT_FOUND = 'الصفحة المطلوبة غير موجودة';
const shots = shotsDir('admin-routes');
const stamp = Date.now().toString(36);
let editorId;

const pathname = (b) => b.evaluate('location.pathname');
const mainText = (b) => b.evaluate(`document.querySelector('main')?.innerText ?? ''`);

async function waitForMain(b, label) {
  await b.waitFor(
    `(() => { const t = document.querySelector('main')?.innerText ?? '';
       return t.length > 20 && !document.querySelector('[aria-busy="true"]'); })()`,
    { label: `${label} content` },
  );
}

async function setToken(b, token) {
  await b.goto(`${ADMIN}/login`);
  await b.evaluate(
    token
      ? `localStorage.setItem(${js(TOKEN_KEY)}, ${js(token)})`
      : `localStorage.removeItem(${js(TOKEN_KEY)})`,
  );
}

run(async () => {
  const token = await adminToken();
  const b = await launch({ port: 9341 });
  try {
    console.log(`Admin routes on ${ADMIN}`);

    await setToken(b, null);
    await b.goto(`${ADMIN}/settings/content`);
    await b.waitFor(`location.pathname === '/login'`, { label: 'redirect to /login' });
    pass('signed out: a deep link redirects to /login');

    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (email && password) {
      await b.evaluate(DOM_HELPERS);
      await b.waitFor(`!!document.querySelector('input[type=email]')`);
      await b.evaluate(`(() => {
        __set(document.querySelector('input[type=email]'), ${js(email)});
        __set(document.querySelector('input[type=password]'), ${js(password)});
        document.querySelector('button[type=submit]').click();
      })()`);
      await b.waitFor(`location.pathname !== '/login'`, { label: 'signed in' });
      pass('sign-in form works and returns to the app');
    } else {
      await setToken(b, token);
    }

    for (const [route, heading] of ROUTES) {
      await b.goto(`${ADMIN}${route}`, 300);
      await waitForMain(b, route);
      const path = await pathname(b);
      const text = await mainText(b);
      assert(path === route, `${route} stayed on ${route} (got ${path})`);
      assert(!text.includes(NOT_FOUND) && !text.includes(FORBIDDEN), `${route} rendered its page`);
      if (heading) assert(text.includes(heading), `${route} shows "${heading}"`);
      pass(`${route} loads directly (refresh)`);
    }

    await b.goto(`${ADMIN}/settings/content`, 300);
    await waitForMain(b, 'refresh');
    await b.goto(`${ADMIN}/settings/content`, 300);
    await waitForMain(b, 'second refresh');
    assert((await pathname(b)) === '/settings/content', 'still on /settings/content');
    await b.screenshot(join(shots, 'settings-content.jpg'));
    pass('/settings/content survives repeated refreshes');

    await b.goto(`${ADMIN}/no-such-admin-page`, 300);
    await waitForMain(b, 'unknown route');
    assert((await mainText(b)).includes(NOT_FOUND), 'admin 404 page');
    pass('unknown admin route shows the in-app 404');

    const editorPassword = `E2e-${randomBytes(9).toString('base64url')}`;
    const created = await api('/admin/users', {
      token,
      method: 'POST',
      body: {
        name: `E2E routes ${stamp}`,
        email: `e2e-routes-${stamp}@mahafeth.local`,
        role: 'EDITOR',
        password: editorPassword,
      },
    });
    assert(created.status === 201, `create editor (HTTP ${created.status})`);
    editorId = created.json.data.id;
    const editorLogin = await api('/auth/login', {
      method: 'POST',
      body: { email: created.json.data.email, password: editorPassword },
    });
    await setToken(b, editorLogin.json.data.accessToken);
    for (const route of ['/users', '/audit-logs', '/leads']) {
      await b.goto(`${ADMIN}${route}`, 300);
      await waitForMain(b, `editor ${route}`);
      assert(
        (await mainText(b)).includes(FORBIDDEN),
        `editor sees the permission notice on ${route}`,
      );
    }
    await b.goto(`${ADMIN}/projects`, 300);
    await waitForMain(b, 'editor /projects');
    assert(!(await mainText(b)).includes(FORBIDDEN), 'editor can open /projects');
    pass('EDITOR: /users, /audit-logs, /leads show the permission notice; /projects opens');

    await b.evaluate(`[...document.querySelectorAll('button')]
      .find((el) => el.innerText.includes('تسجيل الخروج')).click()`);
    await b.waitFor(`location.pathname === '/login'`, { label: 'logout → /login' });
    assert(
      (await b.evaluate(`localStorage.getItem(${js(TOKEN_KEY)})`)) === null,
      'token removed on logout',
    );
    await b.goto(`${ADMIN}/projects`);
    await b.waitFor(`location.pathname === '/login'`, { label: 'guard after logout' });
    pass('logout clears the session and protected routes redirect to /login');

    assert(b.consoleErrors.length === 0, `no page exceptions (${b.consoleErrors.join(' | ')})`);
    pass('no uncaught page exceptions');
  } finally {
    await b.close();
    if (editorId) await api(`/admin/users/${editorId}`, { token, method: 'DELETE' });
  }
  console.log(`\n${passed()} checks passed`);
});
