/**
 * Users, permissions and audit log: API rules for each role, then the admin /users and
 * /audit-logs pages. Creates temporary users and a project, and removes them at the end.
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
  until,
} from './lib/common.mjs';

const stamp = Date.now().toString(36);
const password = () => `E2e-${randomBytes(9).toString('base64url')}`;
const cleanup = { users: [], projects: [] };

async function login(email, pwd) {
  const res = await api('/auth/login', { method: 'POST', body: { email, password: pwd } });
  return res.status === 200 ? res.json.data.accessToken : null;
}

async function createUser(token, role, extra = {}) {
  const input = {
    name: `E2E ${role} ${stamp}`,
    email: `e2e-${role.toLowerCase()}-${stamp}@mahafeth.local`,
    role,
    password: password(),
    ...extra,
  };
  const res = await api('/admin/users', { token, method: 'POST', body: input });
  assert(res.status === 201, `create ${role} (HTTP ${res.status} ${js(res.json)})`);
  cleanup.users.push(res.json.data.id);
  return { ...res.json.data, password: input.password };
}

async function latestLog(token, query) {
  const res = await api(`/admin/audit-logs?pageSize=5&${new URLSearchParams(query)}`, { token });
  assert(res.status === 200, `audit logs (HTTP ${res.status})`);
  return res.json.data[0];
}

async function apiSuite(token) {
  console.log('Permissions');
  const me = await api('/auth/me', { token });
  assert(me.json.data.role === 'SUPER_ADMIN', 'seed admin is a super admin');
  assert(me.json.data.permissions.users.includes('delete'), 'super admin can delete users');
  pass('GET /auth/me returns the role permissions');

  const editor = await createUser(token, 'EDITOR');
  const admin = await createUser(token, 'ADMIN');
  const editorToken = await login(editor.email, editor.password);
  const adminTok = await login(admin.email, admin.password);
  assert(editorToken && adminTok, 'new users can sign in');

  const editorMe = (await api('/auth/me', { token: editorToken })).json.data;
  assert(editorMe.permissions.leads.length === 0, 'editor has no lead permissions');
  const expect = async (tok, path, status, method = 'GET', body) => {
    const res = await api(path, { token: tok, method, body });
    assert(res.status === status, `${method} ${path} → ${status} (got ${res.status})`);
    return res;
  };

  await expect(editorToken, '/admin/projects', 200);
  await expect(editorToken, '/admin/pages', 200);
  await expect(editorToken, '/admin/media', 200);
  await expect(editorToken, '/admin/leads', 403);
  await expect(editorToken, '/admin/users', 403);
  await expect(editorToken, '/admin/audit-logs', 403);
  await expect(editorToken, '/admin/dashboard/leads-chart', 403);
  const summary = await expect(editorToken, '/admin/dashboard/summary', 200);
  assert(summary.json.data.leads === null, 'editor summary hides leads');
  pass('EDITOR: content allowed; leads, users, audit log and lead analytics forbidden');

  const contentOnly = await expect(editorToken, '/admin/settings', 200);
  const keys = contentOnly.json.data.map((s) => s.key);
  assert(
    keys.length > 0 && keys.every((k) => /^(navigation|forms|global|headers)\./.test(k)),
    `editor sees only Global Content settings (${keys})`,
  );
  const nav = contentOnly.json.data.find((s) => s.key === 'navigation.labels');
  await expect(editorToken, '/admin/settings', 200, 'PUT', {
    items: [{ key: nav.key, value: nav.value }],
  });
  const phone = (await api('/admin/settings/contact.phone', { token })).json.data;
  await expect(editorToken, '/admin/settings', 403, 'PUT', {
    items: [{ key: phone.key, value: phone.value }],
  });
  await expect(editorToken, '/admin/settings/contact.phone', 403);
  pass('EDITOR: Global Content editable, site settings forbidden');

  await expect(adminTok, '/admin/leads', 200);
  await expect(adminTok, '/admin/dashboard/leads-chart', 200);
  await expect(adminTok, '/admin/projects', 200);
  await expect(adminTok, '/admin/users', 403);
  await expect(adminTok, '/admin/audit-logs', 403);
  await expect(adminTok, '/admin/settings', 403, 'PUT', {
    items: [{ key: phone.key, value: phone.value }],
  });
  pass('ADMIN: content and leads allowed; users, settings and audit log forbidden');

  console.log('Users');
  const dup = await api('/admin/users', {
    token,
    method: 'POST',
    body: { name: 'Dup', email: editor.email, role: 'EDITOR', password: password() },
  });
  assert(
    dup.status === 409 && dup.json.error.code === 'EMAIL_TAKEN',
    `duplicate email → 409 (${dup.status})`,
  );
  const weak = await api('/admin/users', {
    token,
    method: 'POST',
    body: {
      name: 'Weak',
      email: `weak-${stamp}@mahafeth.local`,
      role: 'EDITOR',
      password: 'short',
    },
  });
  assert(weak.status === 400, 'weak password → 400');
  pass('create validates email uniqueness and password length');

  const byRole = await api(`/admin/users?role=EDITOR&q=${stamp}`, { token });
  assert(js(byRole.json.data.map((u) => u.id)) === js([editor.id]), 'role + search filter');
  const paged = await api(`/admin/users?q=${stamp}&pageSize=1&page=2`, { token });
  assert(paged.json.meta.total === 2 && paged.json.data.length === 1, 'pagination');
  const stats = (await api('/admin/users/stats', { token })).json.data;
  assert(stats.total === stats.active + stats.inactive && stats.byRole.EDITOR >= 1, 'stats');
  pass('list supports search, role filter, pagination and stats');

  const selfDelete = await api(`/admin/users/${me.json.data.id}`, { token, method: 'DELETE' });
  assert(
    selfDelete.status === 400 && selfDelete.json.error.code === 'SELF_DELETE',
    'cannot delete yourself',
  );
  const selfDemote = await api(`/admin/users/${me.json.data.id}`, {
    token,
    method: 'PATCH',
    body: { role: 'EDITOR' },
  });
  assert(
    selfDemote.status === 400 && selfDemote.json.error.code === 'SELF_UPDATE',
    'cannot demote yourself',
  );
  pass('cannot delete, demote or deactivate yourself');

  const newPassword = password();
  await expect(token, `/admin/users/${editor.id}/reset-password`, 204, 'POST', {
    password: newPassword,
  });
  assert((await login(editor.email, editor.password)) === null, 'old password rejected');
  const editorToken2 = await login(editor.email, newPassword);
  assert(editorToken2, 'new password accepted');
  pass('password reset replaces the password');

  await expect(token, `/admin/users/${editor.id}`, 200, 'PATCH', { isActive: false });
  await expect(editorToken2, '/auth/me', 401);
  assert((await login(editor.email, newPassword)) === null, 'inactive user cannot sign in');
  await expect(token, `/admin/users/${editor.id}`, 200, 'PATCH', { isActive: true });
  pass('deactivating a user revokes access immediately');

  console.log('Audit log');
  const created = await expect(editorToken2, '/admin/projects', 201, 'POST', {
    slug: `e2e-audit-${stamp}`,
    titleAr: `مشروع تدقيق ${stamp}`,
    titleEn: `Audit project ${stamp}`,
    city: 'riyadh',
  });
  const projectId = created.json.data.id;
  cleanup.projects.push(projectId);
  await expect(editorToken2, `/admin/projects/${projectId}`, 200, 'PATCH', {
    titleEn: `Audit renamed ${stamp}`,
  });
  await expect(editorToken2, `/admin/projects/${projectId}`, 204, 'DELETE');

  const trail = (await api(`/admin/audit-logs?entity=projects&entityId=${projectId}`, { token }))
    .json.data;
  assert(
    js(trail.map((e) => e.action)) === js(['DELETE', 'UPDATE', 'CREATE']),
    `project trail (${trail.map((e) => e.action)})`,
  );
  assert(
    trail.every((e) => e.userId === editor.id && e.userRole === 'EDITOR'),
    'entries name the editor',
  );
  const update = trail[1];
  assert(
    js(update.oldData) === js({ titleEn: `Audit project ${stamp}` }) &&
      js(update.newData) === js({ titleEn: `Audit renamed ${stamp}` }),
    `update stores only the changed field (${js(update.oldData)} → ${js(update.newData)})`,
  );
  assert(
    trail[2].newData.slug === `e2e-audit-${stamp}` && trail[0].oldData.titleAr,
    'create/delete snapshots',
  );
  assert(trail[0].href === null, 'deleted record has no link');
  pass('project create / update / delete logged with user, diff and snapshots');

  const userLog = await latestLog(token, {
    entity: 'users',
    entityId: editor.id,
    action: 'CREATE',
  });
  assert(userLog && !js(userLog.newData).includes('password'), 'user snapshot has no password');
  const userUpdates = (
    await api(`/admin/audit-logs?entity=users&entityId=${editor.id}&action=UPDATE`, { token })
  ).json.data;
  assert(
    userUpdates.some((e) => e.newData.passwordReset === true),
    'password reset logged',
  );
  assert(
    userUpdates.some((e) => e.oldData?.isActive === true && e.newData.isActive === false),
    'deactivation diff',
  );
  const labels = (await api('/admin/settings/navigation.labels', { token })).json.data;
  const field = Object.keys(labels.value).find((k) => typeof labels.value[k] === 'string');
  const edited = { ...labels.value, [field]: `${labels.value[field]} E2E` };
  const save = (value) =>
    expect(editorToken2, '/admin/settings', 200, 'PUT', { items: [{ key: labels.key, value }] });
  await save(labels.value);
  const before = await latestLog(token, { entity: 'settings', entityId: labels.key });
  await save(edited);
  await save(labels.value);
  const settingLogs = (
    await api(`/admin/audit-logs?entity=settings&entityId=${labels.key}&pageSize=2`, { token })
  ).json.data;
  assert(
    settingLogs[1].newData.value[field] === edited[field] &&
      settingLogs[0].newData.value[field] === labels.value[field] &&
      settingLogs[1].id !== before?.id &&
      settingLogs[0].userId === editor.id,
    'setting edit and restore logged by the editor',
  );
  pass('users (without passwords) and settings changes are logged; unchanged saves are not');

  const lead = await api('/leads', {
    method: 'POST',
    body: { name: `E2E Audit ${stamp}`, phone: '0551234567', source: 'WEBSITE' },
  });
  assert(lead.status === 201, 'public lead submitted');
  const leadLog = await latestLog(token, { entity: 'leads', entityId: lead.json.data.id });
  assert(
    leadLog?.action === 'CREATE' && leadLog.userId === null,
    'website lead logged without a user',
  );
  await expect(adminTok, `/admin/leads/${lead.json.data.id}`, 200, 'PATCH', {
    status: 'CONTACTED',
  });
  const leadUpdate = await latestLog(token, {
    entity: 'leads',
    entityId: lead.json.data.id,
    action: 'UPDATE',
  });
  assert(
    leadUpdate.oldData.status === 'NEW' && leadUpdate.newData.status === 'CONTACTED',
    'lead status diff',
  );
  await expect(adminTok, `/admin/leads/${lead.json.data.id}`, 204, 'DELETE');
  pass('lead submission, status change and delete are logged');

  const pages = (await api('/admin/pages?pageSize=50', { token })).json.data;
  let target;
  for (const page of pages) {
    const sections = (await api(`/admin/sections?pageId=${page.id}`, { token })).json.data;
    const section = sections.find((s) => typeof s.titleAr === 'string' && s.titleAr);
    if (section) {
      target = { page, section };
      break;
    }
  }
  assert(target, 'a page section with a title');
  const { page, section } = target;
  const patchTitle = (titleAr) =>
    expect(editorToken2, `/admin/sections/${section.id}`, 200, 'PATCH', { titleAr });
  await patchTitle(`${section.titleAr} E2E`);
  await patchTitle(section.titleAr);
  const pageLogs = (
    await api(`/admin/audit-logs?entity=pages&entityId=${page.id}&pageSize=2`, { token })
  ).json.data;
  const key = Object.keys(pageLogs[1].newData)[0];
  assert(
    key.startsWith(`section:${section.type}`) &&
      pageLogs[1].newData[key].titleAr === `${section.titleAr} E2E` &&
      pageLogs[0].newData[key].titleAr === section.titleAr &&
      pageLogs.every((e) => e.action === 'UPDATE' && e.userId === editor.id),
    `section edit logged as a page update (${key})`,
  );
  pass('section edits are logged as updates of their page');

  const byUser = (await api(`/admin/audit-logs?userId=${editor.id}&action=CREATE`, { token })).json;
  assert(
    byUser.data.length > 0 &&
      byUser.data.every((e) => e.userId === editor.id && e.action === 'CREATE'),
    'user + action filter',
  );
  pass('audit log filters by user and action');

  return { editor: { ...editor, password: newPassword }, admin };
}

const PAGE_HELPERS = `
  window.__byText = (selector, text) =>
    [...document.querySelectorAll(selector)].find((el) => el.textContent.includes(text));
  window.__clickText = (selector, text) => {
    const el = window.__byText(selector, text);
    if (!el) throw new Error('no ' + selector + ' with ' + text);
    el.click();
    return true;
  };
  true;
`;

async function uiSuite(token, { editor }) {
  const SHOTS = shotsDir('users-audit');
  const browser = await launch({ port: 9337 });
  const { evaluate, waitFor, goto, screenshot } = browser;
  const signIn = async (tok, path) => {
    await goto(`${ADMIN}/login`, 300);
    await evaluate(`localStorage.setItem(${js(TOKEN_KEY)}, ${js(tok)}), true`);
    await goto(`${ADMIN}${path}`, 500);
    await evaluate(DOM_HELPERS);
    await evaluate(PAGE_HELPERS);
  };
  const userFromApi = async (id) => (await api(`/admin/users/${id}`, { token })).json?.data;

  try {
    console.log('Admin · Users page');
    await signIn(token, '/users');
    await waitFor(
      `!!document.querySelector('aside a[href="/users"]') && !!document.querySelector('aside a[href="/audit-logs"]')`,
      {
        label: 'sidebar items',
      },
    );
    const stats = (await api('/admin/users/stats', { token })).json.data;
    await waitFor(`document.querySelectorAll('[data-user-id]').length > 0`, {
      label: 'users table',
    });
    await waitFor(`document.querySelectorAll('main .text-xl.tabular-nums').length >= 4`, {
      label: 'stats cards',
    });
    const cardValues = await evaluate(
      `[...document.querySelectorAll('main .text-xl.tabular-nums')].slice(0, 4).map((el) => el.textContent.trim())`,
    );
    assert(
      js(cardValues) ===
        js([stats.total, stats.active, stats.inactive, stats.byRole.SUPER_ADMIN].map(String)),
      `stats cards ${js(cardValues)} match the API`,
    );
    const me = (await api('/auth/me', { token })).json.data;
    const selfRow = await evaluate(`(() => {
      const row = document.querySelector('[data-user-id="${me.id}"]');
      return { toggleDisabled: row.querySelector('[data-status-toggle]').disabled, canDelete: !!row.querySelector('[aria-label="حذف"]') };
    })()`);
    assert(selfRow.toggleDisabled && !selfRow.canDelete, 'own row: status locked, no delete');
    await screenshot(join(SHOTS, '01-users.jpg'));
    pass('users page: sidebar item, stats cards and table; own account protected');

    await evaluate(`__set(document.querySelector('select[aria-label="الدور"]'), 'EDITOR'), true`);
    await waitFor(`new URLSearchParams(location.search).get('role') === 'EDITOR'`, {
      label: 'role filter URL',
    });
    await waitFor(
      `(() => { const rows = [...document.querySelectorAll('[data-user-id]')]; return rows.length > 0 && rows.every((r) => r.querySelector('[data-role="EDITOR"]')); })()`,
      { label: 'only editors listed' },
    );
    pass('role filter lists only editors');

    await goto(`${ADMIN}/users`, 400);
    await evaluate(DOM_HELPERS);
    await evaluate(PAGE_HELPERS);
    await evaluate(`__clickText('main button', 'مستخدم جديد')`);
    await waitFor(`!!document.querySelector('[role="dialog"] input[name="name"]')`, {
      label: 'create drawer',
    });
    const email = `e2e-ui-${stamp}@mahafeth.local`;
    await evaluate(`(() => {
      const d = document.querySelector('[role="dialog"]');
      __set(d.querySelector('input[name="name"]'), 'E2E UI ${stamp}');
      __set(d.querySelector('input[name="email"]'), '${email}');
      d.querySelector('[aria-label="توليد كلمة مرور قوية"]').click();
      d.querySelector('[role="radio"][data-role="ADMIN"]').click();
      return true;
    })()`);
    await waitFor(
      `document.querySelector('[role="dialog"] input[name="password"]').value.length >= 10`,
      {
        label: 'generated password',
      },
    );
    const generated = await evaluate(
      `document.querySelector('[role="dialog"] input[name="password"]').value`,
    );
    await screenshot(join(SHOTS, '02-create-drawer.jpg'));
    await evaluate(`__clickText('[role="dialog"] button[type="submit"]', 'إضافة المستخدم')`);
    let uiUser;
    await until(async () => {
      const res = await api(`/admin/users?q=${encodeURIComponent(email)}`, { token });
      uiUser = res.json.data[0];
      return Boolean(uiUser);
    }, 'user created from the drawer');
    cleanup.users.push(uiUser.id);
    assert(uiUser.role === 'ADMIN' && uiUser.isActive, 'role and status saved');
    assert(await login(email, generated), 'generated password works');
    pass('create drawer: role selector and password generator create a working account');

    await goto(`${ADMIN}/users?user=${uiUser.id}`, 500);
    await evaluate(DOM_HELPERS);
    await evaluate(PAGE_HELPERS);
    await waitFor(
      `document.querySelector('[role="dialog"] input[name="name"]')?.value === 'E2E UI ${stamp}'`,
      {
        label: 'edit drawer from URL',
      },
    );
    await evaluate(
      `__set(document.querySelector('[role="dialog"] input[name="name"]'), 'E2E Renamed ${stamp}'), true`,
    );
    await evaluate(`__clickText('[role="dialog"] button[type="submit"]', 'حفظ التغييرات')`);
    await until(
      async () => (await userFromApi(uiUser.id))?.name === `E2E Renamed ${stamp}`,
      'rename saved',
    );
    pass('edit drawer (opened by ?user=) saves changes');

    await goto(`${ADMIN}/users?q=${stamp}`, 500);
    await evaluate(DOM_HELPERS);
    await evaluate(PAGE_HELPERS);
    await waitFor(`!!document.querySelector('[data-status-toggle="${uiUser.id}"]')`, {
      label: 'status toggle',
    });
    await evaluate(`document.querySelector('[data-status-toggle="${uiUser.id}"]').click(), true`);
    await until(
      async () => (await userFromApi(uiUser.id))?.isActive === false,
      'status toggled off',
    );
    pass('status toggle deactivates the account');

    await evaluate(
      `document.querySelector('[data-user-id="${uiUser.id}"] [aria-label="إعادة تعيين كلمة المرور"]').click(), true`,
    );
    await waitFor(`!!document.querySelector('[role="dialog"] input[name="password"]')`, {
      label: 'reset dialog',
    });
    await evaluate(
      `document.querySelector('[role="dialog"] [aria-label="توليد كلمة مرور قوية"]').click(), true`,
    );
    await waitFor(
      `document.querySelector('[role="dialog"] input[name="password"]').value.length >= 10`,
      {
        label: 'reset password generated',
      },
    );
    const resetTo = await evaluate(
      `document.querySelector('[role="dialog"] input[name="password"]').value`,
    );
    await screenshot(join(SHOTS, '03-reset-password.jpg'));
    await evaluate(`__clickText('[role="dialog"] button[type="submit"]', 'تعيين كلمة المرور')`);
    await waitFor(`!document.querySelector('[role="dialog"]')`, { label: 'reset dialog closed' });
    await api(`/admin/users/${uiUser.id}`, { token, method: 'PATCH', body: { isActive: true } });
    assert(await login(email, resetTo), 'reset password works');
    assert(!(await login(email, generated)), 'previous password rejected');
    pass('password reset dialog sets a new password');

    await goto(`${ADMIN}/users?q=${stamp}`, 500);
    await evaluate(PAGE_HELPERS);
    await waitFor(`!!document.querySelector('[data-user-id="${uiUser.id}"] [aria-label="حذف"]')`, {
      label: 'delete button',
    });
    await evaluate(
      `document.querySelector('[data-user-id="${uiUser.id}"] [aria-label="حذف"]').click(), true`,
    );
    await waitFor(`!!document.querySelector('[role="alertdialog"]')`, { label: 'confirm dialog' });
    await evaluate(`__clickText('[role="alertdialog"] button', 'حذف')`);
    await until(async () => (await userFromApi(uiUser.id)) === undefined, 'user deleted');
    await waitFor(`!document.querySelector('[data-user-id="${uiUser.id}"]')`, {
      label: 'row removed',
    });
    pass('delete with confirmation removes the user');

    console.log('Admin · Audit log page');
    const uiTrail = (await api(`/admin/audit-logs?entity=users&entityId=${uiUser.id}`, { token }))
      .json.data;
    const renameEntry = uiTrail.find((e) => e.newData?.name === `E2E Renamed ${stamp}`)?.id;
    assert(renameEntry, 'rename logged');
    await goto(`${ADMIN}/audit-logs?entity=users&entityId=${uiUser.id}`, 600);
    await waitFor(`document.querySelectorAll('[data-audit-id]').length === ${uiTrail.length}`, {
      label: 'user trail entries',
    });
    const actions = await evaluate(
      `[...document.querySelectorAll('[data-audit-id]')].map((li) => li.dataset.action + ':' + li.dataset.entity)`,
    );
    assert(
      actions.every((a) => a.endsWith(':users')),
      `entity filter (${actions})`,
    );
    assert(
      actions[0] === 'DELETE:users' && actions.at(-1) === 'CREATE:users',
      `newest first (${actions})`,
    );
    await evaluate(
      `document.querySelector('[data-audit-id="${renameEntry}"] button[aria-expanded]').click(), true`,
    );
    await waitFor(`!!document.querySelector('[data-audit-changes="${renameEntry}"]')`, {
      label: 'diff table',
    });
    const diffRows = await evaluate(
      `[...document.querySelectorAll('[data-audit-changes="${renameEntry}"] tr[data-field]')].map((tr) => [tr.dataset.field, tr.querySelector('[data-before]')?.textContent, tr.querySelector('[data-after]')?.textContent])`,
    );
    assert(
      diffRows.length > 0 && diffRows.every(([, before, after]) => before !== after),
      `diff rows ${js(diffRows)}`,
    );
    await screenshot(join(SHOTS, '04-audit-logs.jpg'));
    pass('audit timeline: entity filter, newest first, expandable before/after diff');

    await goto(`${ADMIN}/audit-logs?action=CREATE&entity=leads`, 600);
    await waitFor(`document.querySelectorAll('[data-audit-id]').length > 0`, {
      label: 'lead creates',
    });
    const leadActions = await evaluate(
      `[...document.querySelectorAll('[data-audit-id]')].map((li) => li.dataset.action + ':' + li.dataset.entity)`,
    );
    assert(
      leadActions.every((a) => a === 'CREATE:leads'),
      'action + entity filters',
    );
    pass('audit timeline: action filter');

    console.log('Admin · Editor role');
    const editorToken = await login(editor.email, editor.password);
    await signIn(editorToken, '/');
    await waitFor(`!!document.querySelector('aside a[href="/projects"]')`, {
      label: 'editor sidebar',
    });
    const links = await evaluate(
      `[...document.querySelectorAll('aside a')].map((a) => a.getAttribute('href'))`,
    );
    for (const hidden of ['/users', '/audit-logs', '/leads', '/settings']) {
      assert(!links.includes(hidden), `editor sidebar hides ${hidden}`);
    }
    assert(
      links.includes('/settings/content') && links.includes('/pages'),
      'editor keeps content items',
    );
    await goto(`${ADMIN}/users`, 500);
    await waitFor(`document.body.textContent.includes('لا تملك صلاحية الوصول')`, {
      label: 'forbidden notice',
    });
    await screenshot(join(SHOTS, '05-editor-forbidden.jpg'));
    await goto(`${ADMIN}/settings/content`, 600);
    await waitFor(`!!document.querySelector('[role="tablist"]')`, {
      label: 'editor opens Global Content',
    });
    pass('EDITOR: sidebar filtered, /users forbidden, Global Content editable');

    assert(
      browser.consoleErrors.length === 0,
      `no page exceptions (${browser.consoleErrors.join(' | ')})`,
    );
    pass('no uncaught page exceptions');
  } finally {
    await browser.close();
  }
  return SHOTS;
}

async function cleanUp(token) {
  for (const id of cleanup.users) await api(`/admin/users/${id}`, { token, method: 'DELETE' });
  for (const id of cleanup.projects)
    await api(`/admin/projects/${id}`, { token, method: 'DELETE' });
}

async function main() {
  const token = await adminToken();
  let shots;
  try {
    const created = await apiSuite(token);
    shots = await uiSuite(token, created);
  } finally {
    await cleanUp(token);
  }
  console.log(`\nAll ${passed()} checks passed. Screenshots: ${shots}`);
}

run(main);
