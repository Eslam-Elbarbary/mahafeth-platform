/**
 * Admin dashboard + routing check against the running stack:
 *   KPI cards match the summary API → leads chart periods → top projects → activity timeline →
 *   quick actions → /settings/content (direct load, sidebar, auth guard) → in-layout 404.
 *
 * Usage: `pnpm test:e2e:dashboard` (set E2E_ADMIN_URL to test a `vite preview` build).
 */
import { join } from 'node:path';

import { launch } from './lib/browser.mjs';
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

const SHOTS = shotsDir('dashboard');
const CONTENT_TITLE = 'المحتوى العام';

async function main() {
  const token = await adminToken();
  const project = (await api('/projects?pageSize=1')).json?.data?.[0];
  assert(project?.slug, 'at least one published project');

  // A project lead so "top projects" and the activity timeline have fresh data.
  const created = await api('/leads', {
    method: 'POST',
    body: {
      name: `E2E Dashboard ${Date.now().toString(36)}`,
      phone: '0550000001',
      projectSlug: project.slug,
      source: 'PROJECT_PAGE',
    },
  });
  assert(created.status === 201, `seed lead (HTTP ${created.status})`);
  const leadId = created.json.data.id;

  const browser = await launch({ port: 9336 });
  const { evaluate, waitFor, goto, screenshot } = browser;
  const h2 = `document.querySelector('main h2, h2')?.textContent.trim()`;

  try {
    console.log('Dashboard');
    const summary = (await api('/admin/dashboard/summary', { token })).json.data;

    await goto(`${ADMIN}/login`, 300);
    await evaluate(`localStorage.setItem(${js(TOKEN_KEY)}, ${js(token)}), true`);
    await goto(`${ADMIN}/`, 500);

    const card = (href) =>
      `document.querySelector('main a[href=${js(href)}] .tabular-nums')?.textContent.trim()`;
    const expected = {
      '/projects': summary.projects.total,
      '/projects?publish=PUBLISHED': summary.projects.published,
      '/projects?featured=true': summary.projects.featured,
      '/services': summary.services.total,
      '/pages': summary.pages.total,
      '/leads': summary.leads.total,
      '/leads?status=NEW': summary.leads.new,
      '/leads?status=CONTACTED': summary.leads.contacted,
      '/leads?status=CONVERTED': summary.leads.converted,
    };
    await waitFor(`${card('/leads?status=CONVERTED')} !== undefined`, { label: 'KPI cards' });
    for (const [href, value] of Object.entries(expected)) {
      const text = await evaluate(card(href));
      assert(text === String(value), `KPI ${href} shows ${value} (got ${text})`);
    }
    pass('9 KPI cards match GET /admin/dashboard/summary');

    await waitFor(`document.querySelectorAll('[data-date]').length === 30`, {
      label: '30-day chart',
    });
    const chart30 = (await api('/admin/dashboard/leads-chart?days=30', { token })).json.data;
    const bars30 = await evaluate(
      `[...document.querySelectorAll('[data-date]')].reduce((s, el) => s + Number(el.dataset.total), 0)`,
    );
    assert(bars30 === chart30.total, `chart bars sum to ${chart30.total} (got ${bars30})`);
    await evaluate(`document.querySelector('[data-days="7"]').click(), true`);
    await waitFor(
      `document.querySelectorAll('[data-date]').length === 7 &&
       document.querySelector('[data-days="7"]').getAttribute('aria-pressed') === 'true'`,
      { label: '7-day chart' },
    );
    const today = await evaluate(
      `[...document.querySelectorAll('[data-date]')].at(-1).dataset.total`,
    );
    assert(Number(today) >= 1, 'today bar includes the seeded lead');
    pass('leads chart renders 30/7-day periods and matches the API');

    await waitFor(`document.querySelectorAll('[data-project-id]').length > 0`, {
      label: 'top projects',
    });
    const topIds = await evaluate(
      `[...document.querySelectorAll('[data-project-id]')].map((el) => el.dataset.projectId)`,
    );
    const topApi = (await api('/admin/dashboard/top-projects?days=7&limit=5', { token })).json.data;
    assert(js(topIds) === js(topApi.map((p) => p.id)), 'top projects order matches the API');
    pass('top projects chart matches GET /admin/dashboard/top-projects');

    await waitFor(`document.querySelectorAll('[data-activity]').length > 0`, { label: 'activity' });
    const firstActivity = await evaluate(
      `document.querySelector('[data-activity]').dataset.activity`,
    );
    assert(firstActivity === 'lead', `newest activity is the seeded lead (got ${firstActivity})`);
    await screenshot(join(SHOTS, '01-dashboard.jpg'));
    pass('activity timeline lists the newest change first');

    console.log('Routing');
    await evaluate(
      `[...document.querySelectorAll('main a')].find((a) => a.getAttribute('href') === '/settings/content').click(), true`,
    );
    await waitFor(`location.pathname === '/settings/content' && ${h2} === ${js(CONTENT_TITLE)}`, {
      label: 'quick action → global content',
    });
    pass('quick action opens /settings/content');

    await goto(`${ADMIN}/settings/content`, 500);
    await waitFor(
      `${h2} === ${js(CONTENT_TITLE)} && !!document.querySelector('[role="tablist"]')`,
      {
        label: 'direct load of /settings/content',
      },
    );
    const active = await evaluate(
      `[...document.querySelectorAll('aside a[aria-current="page"]')].map((a) => a.getAttribute('href'))`,
    );
    assert(
      js(active) === js(['/settings/content']),
      `only the content nav item is active (${active})`,
    );
    await screenshot(join(SHOTS, '02-settings-content.jpg'));
    pass('direct load renders the Global Content editor with its sidebar item active');

    await goto(`${ADMIN}/`, 500);
    await waitFor(`!!document.querySelector('aside a[href="/settings/content"]')`, {
      label: 'sidebar link',
    });
    await evaluate(`document.querySelector('aside a[href="/settings/content"]').click(), true`);
    await waitFor(`location.pathname === '/settings/content' && ${h2} === ${js(CONTENT_TITLE)}`, {
      label: 'sidebar → global content',
    });
    pass('sidebar item opens /settings/content');

    await goto(`${ADMIN}/this-page-does-not-exist`, 500);
    await waitFor(
      `document.body.innerText.includes('404') && !!document.querySelector('aside a[href="/settings/content"]')`,
      { label: 'in-layout 404' },
    );
    pass('unknown admin URL shows 404 inside the layout');

    await evaluate(`localStorage.removeItem(${js(TOKEN_KEY)}), true`);
    await goto(`${ADMIN}/settings/content`, 500);
    await waitFor(`location.pathname === '/login'`, { label: 'auth guard redirect' });
    pass('signed-out visit to /settings/content redirects to /login');

    assert(
      browser.consoleErrors.length === 0,
      `no page exceptions (${browser.consoleErrors.join(' | ')})`,
    );
    pass('no uncaught page exceptions');
    console.log(`\nAll ${passed()} checks passed. Screenshots: ${SHOTS}`);
  } finally {
    await api(`/admin/leads/${leadId}`, { token, method: 'DELETE' });
    await browser.close();
  }
}

run(main);
