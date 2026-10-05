/**
 * Production hardening: security headers, CORS, upload validation, token revocation and sign-in
 * throttling; then audit coverage for media, team, partners, project reorder and project gallery.
 * Everything it creates is hidden (drafts / not visible) and removed at the end.
 */
import { randomBytes } from 'node:crypto';

import { adminToken, API, api, assert, js, pass, passed, run } from './lib/common.mjs';

const stamp = Date.now().toString(36);
const cleanup = { media: [], team: [], partners: [], projects: [], users: [] };

/* 1×1 PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function uploadFile(token, { bytes, type, name }) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  form.append('altAr', `e2e ${stamp}`);
  const res = await fetch(`${API}/admin/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (res.status === 201) cleanup.media.push(json.data.id);
  return { status: res.status, json };
}

const logsOf = async (token, query) =>
  (await api(`/admin/audit-logs?pageSize=20&${new URLSearchParams(query)}`, { token })).json.data;

async function securitySuite(token) {
  console.log('Headers and CORS');
  const health = await fetch(`${API}/health`, { headers: { Origin: 'http://localhost:5173' } });
  const csp = health.headers.get('content-security-policy') ?? '';
  assert(
    csp.includes("default-src 'none'") && csp.includes("frame-ancestors 'none'"),
    `API CSP (${csp})`,
  );
  assert(health.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options DENY');
  assert(health.headers.get('x-content-type-options') === 'nosniff', 'nosniff');
  assert(health.headers.get('referrer-policy') === 'no-referrer', 'Referrer-Policy');
  assert(!health.headers.get('x-powered-by'), 'no X-Powered-By');
  pass('helmet: strict CSP, no framing, nosniff, no-referrer, no X-Powered-By');

  assert(
    health.headers.get('access-control-allow-origin') === 'http://localhost:5173',
    'allowed origin',
  );
  const evil = await fetch(`${API}/health`, { headers: { Origin: 'https://evil.example' } });
  assert(!evil.headers.get('access-control-allow-origin'), 'unknown origin gets no CORS headers');
  const preflight = await fetch(`${API}/admin/projects`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });
  assert(
    preflight.status === 204 &&
      /PATCH/.test(preflight.headers.get('access-control-allow-methods') ?? ''),
    'preflight',
  );
  pass('CORS: allowlisted origins only; preflight allows the admin methods');

  const projects = await api('/projects?pageSize=1');
  assert(Number(projects.status) === 200, 'public API reachable');
  const limited = await fetch(`${API}/projects?pageSize=1`);
  assert(Number(limited.headers.get('ratelimit-limit')) > 0, 'global rate limit headers');
  pass(
    `global rate limit active (${limited.headers.get('ratelimit-limit')} requests/minute per IP)`,
  );

  console.log('Uploads');
  const disguised = await uploadFile(token, {
    bytes: Buffer.from('<html><script>alert(1)</script></html>'),
    type: 'image/png',
    name: 'avatar.png',
  });
  assert(
    disguised.status === 415 && disguised.json.error.code === 'INVALID_FILE_CONTENT',
    `HTML posing as PNG → 415 (${disguised.status})`,
  );
  const evilSvg = await uploadFile(token, {
    bytes: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="4"/></svg>',
    ),
    type: 'image/svg+xml',
    name: 'logo.svg',
  });
  assert(evilSvg.status === 415, `scripted SVG → 415 (${evilSvg.status})`);
  const wrongType = await uploadFile(token, { bytes: PNG, type: 'text/html', name: 'x.html' });
  assert(wrongType.status === 415, 'text/html refused');
  pass('uploads: content must match the type; scripted SVG and HTML refused');

  const png = await uploadFile(token, { bytes: PNG, type: 'image/png', name: '../../evil.html' });
  assert(png.status === 201, `valid PNG uploads (${png.status} ${js(png.json)})`);
  assert(
    png.json.data.filename.endsWith('.png') && png.json.data.originalName === 'evil.html',
    `stored as .png, name without path (${png.json.data.filename}, ${png.json.data.originalName})`,
  );
  const svg = await uploadFile(token, {
    bytes: Buffer.from(
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>',
    ),
    type: 'image/svg+xml',
    name: 'dot.svg',
  });
  assert(svg.status === 201, `safe SVG uploads (${svg.status})`);
  const served = await fetch(new URL(svg.json.data.url, API.replace(/\/api\/v1$/, '/')));
  assert(
    (served.headers.get('content-security-policy') ?? '').includes('sandbox'),
    'SVG served sandboxed',
  );
  assert(
    served.headers.get('cross-origin-resource-policy') === 'cross-origin',
    'uploads embeddable by the website',
  );
  pass(
    'uploads: extension from the verified type, path stripped from the name, SVG served sandboxed',
  );

  console.log('Tokens and sign-in');
  const email = `e2e-sec-${stamp}@mahafeth.local`;
  const pwd = `E2e-${randomBytes(9).toString('base64url')}`;
  const created = await api('/admin/users', {
    token,
    method: 'POST',
    body: { name: `E2E Sec ${stamp}`, email, role: 'EDITOR', password: pwd },
  });
  assert(created.status === 201, 'temp user');
  cleanup.users.push(created.json.data.id);
  const login = async (password) =>
    api('/auth/login', { method: 'POST', body: { email, password } });
  const first = (await login(pwd)).json.data.accessToken;
  assert((await api('/auth/me', { token: first })).status === 200, 'token works');
  const pwd2 = `E2e-${randomBytes(9).toString('base64url')}`;
  await new Promise((r) => setTimeout(r, 1100));
  const reset = await api(`/admin/users/${created.json.data.id}/reset-password`, {
    token,
    method: 'POST',
    body: { password: pwd2 },
  });
  assert(reset.status === 204, 'reset');
  assert(
    (await api('/auth/me', { token: first })).status === 401,
    'token issued before the reset is revoked',
  );
  const second = (await login(pwd2)).json.data.accessToken;
  await new Promise((r) => setTimeout(r, 1100));
  const pwd3 = `E2e-${randomBytes(9).toString('base64url')}`;
  const changed = await api('/auth/change-password', {
    token: second,
    method: 'POST',
    body: { currentPassword: pwd2, newPassword: pwd3 },
  });
  assert(
    changed.status === 200 && changed.json.data.accessToken,
    'change-password returns a fresh token',
  );
  assert(
    (await api('/auth/me', { token: second })).status === 401,
    'old session revoked by password change',
  );
  assert(
    (await api('/auth/me', { token: changed.json.data.accessToken })).status === 200,
    'fresh token works',
  );
  pass('password reset / change revokes earlier tokens; change-password returns a new one');

  const tooLong = await api('/admin/users', {
    token,
    method: 'POST',
    body: {
      name: 'Long',
      email: `long-${stamp}@mahafeth.local`,
      role: 'EDITOR',
      password: 'كلمة'.repeat(10),
    },
  });
  assert(tooLong.status === 400, 'passwords over 72 bytes refused (bcrypt limit)');
  pass('password policy: 10+ characters, at most 72 bytes');

  const ghost = `ghost-${stamp}@mahafeth.local`;
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    statuses.push(
      (
        await api('/auth/login', {
          method: 'POST',
          body: { email: ghost, password: 'wrong-password' },
        })
      ).status,
    );
  }
  assert(
    js(statuses) === js([401, 401, 401, 401, 401, 429]),
    `per-account lockout after 5 failures (${statuses})`,
  );
  assert((await login(pwd3)).status === 200, 'other accounts unaffected');
  pass('sign-in: 5 failed attempts lock that account for 15 minutes');
}

async function auditSuite(token) {
  console.log('Audit · media');
  const media = cleanup.media.at(-1);
  await api(`/admin/media/${media}`, { token, method: 'PATCH', body: { altEn: `alt ${stamp}` } });
  await api(`/admin/media/${media}`, { token, method: 'DELETE' });
  const mediaLogs = await logsOf(token, { entity: 'media', entityId: media });
  assert(
    js(mediaLogs.map((e) => e.action)) === js(['DELETE', 'UPDATE', 'CREATE']),
    `media trail (${mediaLogs.map((e) => e.action)})`,
  );
  assert(
    mediaLogs[1].newData.altEn === `alt ${stamp}` &&
      mediaLogs[2].newData.mimeType === 'image/svg+xml',
    'media diff + snapshot',
  );
  pass('media upload / update / delete logged');

  console.log('Audit · team and partners');
  for (const [entity, path, body] of [
    [
      'team',
      '/admin/team',
      (n) => ({
        nameAr: `عضو ${n} ${stamp}`,
        nameEn: `Member ${n}`,
        positionAr: 'منصب',
        positionEn: 'Role',
        visible: false,
        order: 90_000 + n,
      }),
    ],
    [
      'partners',
      '/admin/partners',
      (n) => ({
        nameAr: `شريك ${n} ${stamp}`,
        nameEn: `Partner ${n}`,
        visible: false,
        order: 90_000 + n,
      }),
    ],
  ]) {
    const a = (await api(path, { token, method: 'POST', body: body(1) })).json.data;
    const b = (await api(path, { token, method: 'POST', body: body(2) })).json.data;
    cleanup[entity].push(a.id, b.id);
    await api(`${path}/${a.id}`, { token, method: 'PATCH', body: { nameEn: `Renamed ${stamp}` } });
    const reorder = await api(`${path}/reorder`, {
      token,
      method: 'PUT',
      body: {
        items: [
          { id: a.id, order: b.order },
          { id: b.id, order: a.order },
        ],
      },
    });
    assert(reorder.status === 204, `${entity} reorder`);
    await api(`${path}/${b.id}`, { token, method: 'DELETE' });

    const trail = await logsOf(token, { entity, entityId: a.id });
    assert(
      js(trail.map((e) => e.action)) === js(['UPDATE', 'CREATE']),
      `${entity} trail (${trail.map((e) => e.action)})`,
    );
    assert(
      trail[0].newData.nameEn === `Renamed ${stamp}` && trail[1].newData.visible === false,
      `${entity} diff + snapshot`,
    );
    const [order] = await logsOf(token, { entity, entityId: 'order' });
    assert(
      order.newData[`order:${a.nameAr}`] === b.order &&
        order.oldData[`order:${b.nameAr}`] === b.order,
      `${entity} reorder entry (${js(order.newData)})`,
    );
    assert(order.href === `/${entity}`, 'reorder links to the list');
    const [deleted] = await logsOf(token, { entity, entityId: b.id, action: 'DELETE' });
    assert(deleted?.oldData.nameAr === b.nameAr, `${entity} delete snapshot`);
  }
  pass('team and partners: create / update / delete / reorder logged');

  console.log('Audit · projects');
  const newProject = async (n) => {
    const res = await api('/admin/projects', {
      token,
      method: 'POST',
      body: {
        slug: `e2e-sec-${n}-${stamp}`,
        titleAr: `مشروع ${n} ${stamp}`,
        titleEn: `Project ${n}`,
        city: 'riyadh',
        order: 90_000 + n,
      },
    });
    assert(res.status === 201, `project ${n}`);
    cleanup.projects.push(res.json.data.id);
    return res.json.data;
  };
  const p1 = await newProject(1);
  const p2 = await newProject(2);
  const reorder = await api('/admin/projects/reorder', {
    token,
    method: 'PUT',
    body: {
      items: [
        { id: p1.id, order: p2.order },
        { id: p2.id, order: p1.order },
      ],
    },
  });
  assert(reorder.status === 204, `PUT /admin/projects/reorder (${reorder.status})`);
  const [projectOrder] = await logsOf(token, { entity: 'projects', entityId: 'order' });
  assert(projectOrder.newData[`order:${p1.titleAr}`] === p2.order, 'project reorder logged');
  pass('project reorder endpoint + audit entry');

  const image = cleanup.media[0];
  const second = await uploadFile(token, { bytes: PNG, type: 'image/png', name: 'second.png' });
  const add = async (mediaId) => {
    const res = await api(`/admin/projects/${p1.id}/images`, {
      token,
      method: 'POST',
      body: { mediaId, captionAr: 'صورة' },
    });
    assert(res.status === 201, `add image (${res.status} ${js(res.json)})`);
    return res.json.data;
  };
  const img1 = await add(image);
  const img2 = await add(second.json.data.id);
  await api(`/admin/projects/${p1.id}/images/${img1.id}`, {
    token,
    method: 'PATCH',
    body: { captionAr: `وصف ${stamp}` },
  });
  await api(`/admin/projects/${p1.id}/images/reorder`, {
    token,
    method: 'PUT',
    body: {
      items: [
        { id: img1.id, order: img2.order },
        { id: img2.id, order: img1.order },
      ],
    },
  });
  await api(`/admin/projects/${p1.id}/images/${img2.id}`, { token, method: 'DELETE' });

  const gallery = (await logsOf(token, { entity: 'projects', entityId: p1.id })).filter((e) =>
    Object.keys(e.newData ?? {}).some((k) => k.startsWith('gallery:')),
  );
  const k1 = `gallery:${img1.id.slice(-8)}`;
  const k2 = `gallery:${img2.id.slice(-8)}`;
  const [removed, reordered, updated, added2, added1] = gallery;
  assert(
    gallery.length === 5 && gallery.every((e) => e.action === 'UPDATE'),
    `5 gallery entries (${gallery.length})`,
  );
  assert(
    added1.oldData[k1] === null &&
      added1.newData[k1].mediaId === image &&
      added1.newData[k1].category === 'GALLERY',
    'image add',
  );
  assert(
    added2.newData[k2] &&
      updated.newData[k1].captionAr === `وصف ${stamp}` &&
      js(Object.keys(updated.newData[k1])) === js(['captionAr']),
    'image update stores only the change',
  );
  assert(
    reordered.newData[k1].order === img2.order && reordered.oldData[k2].order === img2.order,
    'image reorder',
  );
  assert(removed.newData[k2] === null && removed.oldData[k2].url, 'image delete');
  pass('project gallery: add / update / reorder / delete logged as project updates');

  const all = js(await logsOf(token, { q: stamp }));
  assert(
    !/password|accessToken|passwordHash/i.test(all.replace(/"passwordReset":true/g, '')),
    'no secrets in audit entries',
  );
  pass('no passwords or tokens in the logged data');
}

async function cleanUp(token) {
  for (const id of cleanup.projects)
    await api(`/admin/projects/${id}`, { token, method: 'DELETE' });
  for (const id of cleanup.team) await api(`/admin/team/${id}`, { token, method: 'DELETE' });
  for (const id of cleanup.partners)
    await api(`/admin/partners/${id}`, { token, method: 'DELETE' });
  for (const id of cleanup.media) await api(`/admin/media/${id}`, { token, method: 'DELETE' });
  for (const id of cleanup.users) await api(`/admin/users/${id}`, { token, method: 'DELETE' });
}

async function main() {
  const token = await adminToken();
  try {
    await securitySuite(token);
    await auditSuite(token);
  } finally {
    await cleanUp(token);
  }
  console.log(`\nAll ${passed()} checks passed.`);
}

run(main);
