/**
 * Leads CRM end-to-end check against the running dev stack:
 *   website form (prefill + submit) → admin list/search → drawer status/notes/assignee →
 *   status & project filters → delete.
 *
 * Usage: `pnpm test:e2e:leads` with backend (:4000), web (:3000) and admin (:5173) running.
 * Admin credentials come from E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD or the backend `.env` seed values.
 */
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
  until,
  WEB,
} from './lib/common.mjs';

const SHOTS = shotsDir('leads');

async function main() {
  const token = await adminToken();

  const projects = await api('/projects?pageSize=5');
  const project = projects.json?.data?.[0];
  assert(project?.slug, 'at least one published project');

  const name = `E2E Lead ${Date.now().toString(36)}`;
  const note = 'E2E: called, follow up on Sunday';
  let leadId = null;

  const browser = await launch();
  const { evaluate, waitFor, goto, screenshot, send } = browser;
  const pressEscape = async () => {
    for (const type of ['keyDown', 'keyUp']) {
      await send('Input.dispatchKeyEvent', {
        type,
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
    }
  };

  try {
    console.log('Website');

    await goto(`${WEB}/en/contact?interest=partner#interest`, 1500);
    await waitFor(
      `document.querySelector('#interestChips [data-k="partner"]')?.getAttribute('aria-pressed') === 'true'`,
      { label: '?interest= prefill' },
    );
    pass('?interest=partner pre-selects the interest chip (EN)');

    await goto(
      `${WEB}/ar/contact?project=${encodeURIComponent(project.slug)}&interest=invest`,
      1500,
    );
    await waitFor(
      `document.querySelector('.lead__proj b')?.textContent.trim().length > 0 &&
       document.querySelector('#interestChips [data-k="invest"]')?.getAttribute('aria-pressed') === 'true' &&
       !!document.querySelector('[data-name="city"] [aria-pressed="true"]')`,
      { label: '?project=&interest= prefill' },
    );
    pass('?project=&interest= pre-fills the project, its city and the interest (AR)');

    await evaluate(DOM_HELPERS);
    await evaluate(`(() => {
      document.getElementById('leadForm').scrollIntoView({ block: 'center' });
      __set(document.getElementById('fName'), ${js(name)});
      __set(document.getElementById('fTel'), '055 123 4567');
      return true;
    })()`);
    await evaluate(`document.getElementById('leadForm').requestSubmit(), true`);
    await waitFor(`document.getElementById('leadOk')?.hidden === false`, {
      label: 'form success state',
    });
    await new Promise((r) => setTimeout(r, 900));
    await screenshot(join(SHOTS, '01-website-submitted.jpg'));
    pass('form submits and shows the success state');

    const found = await api(`/admin/leads?q=${encodeURIComponent(name)}`, { token });
    assert(found.json?.meta.total === 1, 'exactly one lead stored');
    const lead = found.json.data[0];
    leadId = lead.id;
    assert(lead.status === 'NEW', `status NEW (got ${lead.status})`);
    assert(lead.source === 'PROJECT_PAGE', `source PROJECT_PAGE (got ${lead.source})`);
    assert(lead.interestType === 'INVEST', `interestType INVEST (got ${lead.interestType})`);
    assert(lead.project?.slug === project.slug, 'project relation resolved from the slug');
    assert(lead.phone === '0551234567', `phone normalised (got ${lead.phone})`);
    assert(lead.locale === 'ar', 'locale ar');
    pass('lead stored with source, interest, project, phone and locale');

    console.log('Admin');

    await goto(`${ADMIN}/login`, 300);
    await evaluate(`localStorage.setItem(${js(TOKEN_KEY)}, ${js(token)}), true`);
    await goto(`${ADMIN}/leads`, 500);
    const row = `document.querySelector('tr[data-lead-id="${leadId}"]')`;
    await waitFor(`!!${row}`, { label: 'lead row in the admin table' });
    pass('lead appears in the admin table');

    await evaluate(DOM_HELPERS);
    await evaluate(`__set(document.querySelector('input[type="search"]'), ${js(name)}), true`);
    await waitFor(
      `location.search.includes('q=') && document.querySelectorAll('tbody tr[data-lead-id]').length === 1 && !!${row}`,
      { label: 'search narrows to the lead' },
    );
    await screenshot(join(SHOTS, '02-admin-search.jpg'));
    pass('search narrows the table to the lead');

    await evaluate(`${row}.querySelector('button').click(), true`);
    const dialog = `document.querySelector('[role="dialog"]')`;
    await waitFor(
      `${dialog}?.textContent.includes(${js(name)}) && !!${dialog}.querySelector('textarea')`,
      {
        label: 'details drawer',
      },
    );
    pass('row opens the details drawer');

    await evaluate(`${dialog}.querySelector('[data-status="QUALIFIED"]').click(), true`);
    await waitFor(
      `${dialog}.querySelector('[data-status="QUALIFIED"]').getAttribute('aria-pressed') === 'true'`,
      { label: 'status QUALIFIED in drawer' },
    );
    await until(
      async () => (await api(`/admin/leads/${leadId}`, { token })).json.data.status === 'QUALIFIED',
      'API status',
    );
    pass('status update persists (QUALIFIED)');

    await evaluate(`__set(${dialog}.querySelector('textarea'), ${js(note)}), true`);
    await evaluate(`(() => {
      const save = [...${dialog}.querySelectorAll('button')].find((b) => b.textContent.includes('حفظ'));
      save.click();
      return true;
    })()`);
    await until(
      async () => (await api(`/admin/leads/${leadId}`, { token })).json.data.notes === note,
      'API notes',
    );
    await waitFor(
      `${dialog}.querySelector('textarea').value === ${js(note)} && !${dialog}.querySelector('.animate-spin')`,
      {
        label: 'notes saved in drawer',
      },
    );
    pass('notes editing persists');

    const assignees = (await api('/admin/leads/assignees', { token })).json.data;
    await evaluate(`__set(${dialog}.querySelector('select'), ${js(assignees[0].id)}), true`);
    await until(
      async () =>
        (await api(`/admin/leads/${leadId}`, { token })).json.data.assignedTo?.id ===
        assignees[0].id,
      'API assignee',
    );
    await screenshot(join(SHOTS, '03-admin-drawer.jpg'));
    pass('assignee update persists');

    await pressEscape();
    await waitFor(`!${dialog} && !location.search.includes('lead=')`, { label: 'drawer closed' });

    const statusBtn = (s) => `document.querySelector('[role="group"] [data-status="${s}"]')`;
    await evaluate(`${statusBtn('QUALIFIED')}.click(), true`);
    await waitFor(
      `location.search.includes('status=QUALIFIED') && ${statusBtn('QUALIFIED')}.getAttribute('aria-pressed') === 'true' && !!${row}`,
      { label: 'QUALIFIED filter shows the lead' },
    );
    await screenshot(join(SHOTS, '04-admin-filter-qualified.jpg'));
    await evaluate(`${statusBtn('NEW')}.click(), true`);
    await waitFor(`location.search.includes('status=NEW') && !${row}`, {
      label: 'NEW filter hides the lead',
    });
    pass('status filter includes/excludes the lead');

    await evaluate(`${statusBtn('ALL')}.click(), true`);
    await waitFor(`!location.search.includes('status=') && !!${row}`, { label: 'ALL filter' });
    await evaluate(
      `__set(document.querySelector('select[aria-label="المشروع"]'), ${js(lead.project.id)}), true`,
    );
    await waitFor(`location.search.includes('project=') && !!${row}`, {
      label: 'project filter shows the lead',
    });
    const [byNew, byQualified, byProject] = await Promise.all([
      api(`/admin/leads?status=NEW&q=${encodeURIComponent(name)}`, { token }),
      api(`/admin/leads?status=QUALIFIED&q=${encodeURIComponent(name)}`, { token }),
      api(`/admin/leads?projectId=${lead.project.id}&q=${encodeURIComponent(name)}`, { token }),
    ]);
    assert(byNew.json.meta.total === 0 && byQualified.json.meta.total === 1, 'API status filter');
    assert(byProject.json.meta.total === 1, 'API project filter');
    pass('project filter (UI + API) and API status filter');

    await evaluate(`${row}.querySelector('button').click(), true`);
    await waitFor(`${dialog}?.textContent.includes(${js(name)})`, { label: 'drawer reopened' });
    await evaluate(`(() => {
      const del = [...${dialog}.querySelectorAll('button')].find((b) => b.textContent.includes('حذف'));
      del.click();
      return true;
    })()`);
    const confirm = `document.querySelector('[role="alertdialog"]')`;
    await waitFor(`!!${confirm}`, { label: 'delete confirmation' });
    await screenshot(join(SHOTS, '05-admin-delete-confirm.jpg'));
    await evaluate(`(() => {
      const ok = [...${confirm}.querySelectorAll('button')].find((b) => b.textContent.trim() === 'حذف');
      ok.click();
      return true;
    })()`);
    await waitFor(`!${confirm} && !${dialog} && !${row}`, { label: 'lead removed from the table' });
    assert((await api(`/admin/leads/${leadId}`, { token })).status === 404, 'API 404 after delete');
    await screenshot(join(SHOTS, '06-admin-deleted.jpg'));
    pass('delete with confirmation removes the lead');
    leadId = null;

    assert(
      browser.consoleErrors.length === 0,
      `no page exceptions (${browser.consoleErrors.join(' | ')})`,
    );
    pass('no uncaught page exceptions');
    console.log(`\nAll ${passed()} checks passed. Screenshots: ${SHOTS}`);
  } finally {
    if (leadId) await api(`/admin/leads/${leadId}`, { token, method: 'DELETE' });
    await browser.close();
  }
}

run(main);
