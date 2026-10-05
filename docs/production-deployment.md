# Production deployment

How to run Mahafeth (website, admin, API) on a single Linux server behind Nginx. Commands assume
Ubuntu 24.04 LTS; adapt package names for other distributions. Replace `mahafeth.com` /
`admin.mahafeth.com` with the real domains throughout.

```
                              Internet
                                 │  HTTPS :443 (HTTP :80 → 301 to HTTPS)
                                 ▼
                    ┌──────────────────────────┐
                    │          Nginx           │  TLS, security headers, SPA fallback,
                    │  (deploy/nginx/*.conf)   │  sets X-Forwarded-For = client IP
                    └──┬───────────┬────────┬──┘
     mahafeth.com /    │           │        │  admin.mahafeth.com /
                       ▼           │        ▼
        ┌─────────────────────┐    │   ┌──────────────────────────┐
        │ Website (Next.js)   │    │   │ Admin (static SPA)       │
        │ PM2 mahafeth-web    │    │   │ apps/admin/dist          │
        │ 127.0.0.1:3000      │    │   │ served by Nginx directly │
        └───┬──────────▲──────┘    │   └──────────────────────────┘
            │          │           │  /api/v1/*  and  /uploads/*  (both domains)
            │ CMS_API_URL          ▼
            │ (server-side,   ┌─────────────────────┐      ┌───────────────────────┐
            │  direct)        │ API (Express)       │─────▶│ MySQL 8.4             │
            └────────────────▶│ PM2 mahafeth-api    │      │ 127.0.0.1:3306        │
                       ▲      │ 127.0.0.1:4000      │      └───────────────────────┘
                       │      └──┬──────────────┬───┘
   POST /api/revalidate│         │              │   uploads on disk
   (WEB_REVALIDATE_URL,│         │              ▼
    after admin writes)└─────────┘     /var/lib/mahafeth/uploads
```

- Only Nginx listens on public interfaces. The API and the Next server bind to `127.0.0.1`.
- Browsers always call `/api/v1` and load `/uploads` **on the domain they are on**, so the website
  and admin need no CORS, and admin bundles never contain a backend hostname.
- The website's server reads the API directly (`CMS_API_URL=http://127.0.0.1:4000/api/v1`) and its
  image optimizer loads `/uploads/…` through a Next rewrite to the same internal address. No
  remote-image allowlist or private-IP exception is involved.
- The backend tells the website to drop its CMS cache right after each admin change by calling
  `http://127.0.0.1:3000/api/revalidate` with a shared secret. Nginx blocks that path from the
  internet.

---

## 1. Server requirements

| Item    | Minimum                                                     |
| ------- | ----------------------------------------------------------- |
| OS      | Ubuntu 22.04/24.04 LTS (or any Linux with systemd)          |
| CPU/RAM | 2 vCPU, 4 GB RAM (the Next build needs ~2 GB)               |
| Disk    | 20 GB + media + backups (keep backups on a separate volume) |
| Network | Ports 80 and 443 open; 22 for SSH. Nothing else public.     |
| DNS     | A/AAAA records for `mahafeth.com`, `www`, `admin`           |

Create a dedicated system user that owns the app, uploads and logs:

```bash
sudo adduser --system --group --home /srv/mahafeth --shell /bin/bash mahafeth
sudo mkdir -p /srv/mahafeth/{releases,shared} /var/lib/mahafeth/uploads /var/log/mahafeth /var/backups/mahafeth
sudo chown -R mahafeth:mahafeth /srv/mahafeth /var/lib/mahafeth /var/log/mahafeth /var/backups/mahafeth
sudo chmod 750 /var/lib/mahafeth/uploads /var/backups/mahafeth
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

## 2. Node.js and pnpm

The repo requires Node ≥ 22.12 and pins pnpm 9.15.9 (`packageManager` in package.json).

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable          # provides the pinned pnpm version
sudo npm install -g pm2
node -v && pnpm -v && pm2 -v
```

## 3. MySQL

MySQL 8.4 LTS (what development runs in docker-compose). MariaDB is not tested.

```bash
sudo apt-get install -y mysql-server mysql-client   # or the MySQL APT repo for 8.4
sudo mysql_secure_installation
```

Keep MySQL bound to localhost (`bind-address = 127.0.0.1`, the Ubuntu default). The API connects
over loopback TCP or the Unix socket; MySQL 8's default `caching_sha2_password` works over both.
A database on another host must use TLS or a private network (see `apps/backend/src/lib/prisma.ts`).

## 4. Database setup

Two accounts: the API runs with data-only rights; migrations, backups and restores use a separate
maintenance account. Generate passwords with `openssl rand -base64 32 | tr -d '/+=' | cut -c1-32`.

```sql
-- sudo mysql
CREATE DATABASE mahafeth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Runtime (apps/backend/.env DATABASE_URL)
CREATE USER 'mahafeth_app'@'localhost' IDENTIFIED BY '<app-password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON mahafeth.* TO 'mahafeth_app'@'localhost';

-- Migrations, backups, restores (passed inline, never stored in the API's .env)
CREATE USER 'mahafeth_admin'@'localhost' IDENTIFIED BY '<admin-password>';
GRANT ALL PRIVILEGES ON mahafeth.* TO 'mahafeth_admin'@'localhost';

FLUSH PRIVILEGES;
```

Prisma also connects as `127.0.0.1`; if MySQL resolves that to a different account host, create
the users for `'127.0.0.1'` as well, or use the socket URL
`mysql://mahafeth_app:<pw>@localhost/mahafeth?socket=/var/run/mysqld/mysqld.sock`.

Simpler alternative (one account): grant `ALL PRIVILEGES ON mahafeth.*` to `mahafeth_app` and
skip the inline `DATABASE_URL` overrides below. The API then has DDL rights it does not need.

The API refuses to start in production with the `root` user or the development passwords.

## 5. Repository setup

Each deploy is a fresh directory under `releases/`, and `current` points at the live one. Env files
and uploads live outside releases, so a rollback is a symlink switch.

```bash
sudo -iu mahafeth
cd /srv/mahafeth
RELEASE=releases/$(date +%Y%m%d-%H%M)
git clone --depth 1 --branch <tag-or-main> <repo-url> "$RELEASE"
cd "$RELEASE"
pnpm install --frozen-lockfile
```

`pnpm install` includes dev dependencies: TypeScript, Prisma CLI and tsx are needed to build,
migrate and seed.

## 6. Environment variables

Create the env files once in `shared/` and link them into every release:

```bash
cp apps/backend/.env.example /srv/mahafeth/shared/backend.env
cp apps/web/.env.example     /srv/mahafeth/shared/web.env
chmod 600 /srv/mahafeth/shared/*.env
# then, in each release:
ln -sfn /srv/mahafeth/shared/backend.env apps/backend/.env
ln -sfn /srv/mahafeth/shared/web.env     apps/web/.env.production.local
```

Generate secrets with
`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

### apps/backend/.env (`shared/backend.env`)

| Variable                | Production value                                    | Notes                                                    |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `NODE_ENV`              | `production`                                        | Turns on the production guards, HSTS, hides error detail |
| `HOST` / `PORT`         | `127.0.0.1` / `4000`                                | Only Nginx and the website reach the API                 |
| `LOG_LEVEL`             | `info`                                              | JSON logs; tokens and cookies are redacted               |
| `DATABASE_URL`          | `mysql://mahafeth_app:<pw>@127.0.0.1:3306/mahafeth` | URL-encode special characters in the password            |
| `CORS_ORIGINS`          | `https://mahafeth.com,https://admin.mahafeth.com`   | https only; localhost refused                            |
| `TRUST_PROXY`           | `loopback`                                          | Nginx on the same host (see §12)                         |
| `RATE_LIMIT_PER_MINUTE` | `600`                                               | Per client IP, whole API                                 |
| `RATE_LIMIT_ALLOWLIST`  | `127.0.0.1`                                         | The website's server-side rendering                      |
| `JWT_SECRET`            | 48+ random bytes                                    | **Secret.** Rotating it signs everyone out               |
| `JWT_EXPIRES_IN`        | `12h`                                               |                                                          |
| `UPLOAD_DIR`            | `/var/lib/mahafeth/uploads`                         | Outside the release; writable by `mahafeth`              |
| `MEDIA_BASE_URL`        | `/uploads`                                          | Keep relative unless media moves to a CDN                |
| `MAX_UPLOAD_MB`         | `20`                                                | Keep Nginx `client_max_body_size` (25m) above it         |
| `API_DOCS`              | unset (off in production)                           | Swagger UI                                               |
| `WEB_REVALIDATE_URL`    | `http://127.0.0.1:3000/api/revalidate`              | Set together with the secret, or neither                 |
| `REVALIDATE_SECRET`     | 32+ random bytes                                    | **Secret.** Same value in web.env                        |
| `SEED_ADMIN_*`          | First super admin (only for the first seed)         | **Secret.** Remove the password after the first sign-in  |
| `BACKUP_DIR`            | `/var/backups/mahafeth`                             | Read by the backup scripts only                          |

### apps/web/.env.production.local (`shared/web.env`)

| Variable               | Production value                      | Notes                                                        |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | `https://mahafeth.com`                | **Build time.** Canonical, sitemap, robots, Open Graph       |
| `NEXT_PUBLIC_API_URL`  | `https://mahafeth.com/api/v1`         | **Build time.** Used by the browser (interest form)          |
| `CMS_API_URL`          | `http://127.0.0.1:4000/api/v1`        | Build time and runtime. SSR reads and the `/uploads` rewrite |
| `CMS_ENABLED`          | `true`                                | `false` serves the bundled fallback content                  |
| `REVALIDATE_SECRET`    | same as the backend                   | **Secret**                                                   |
| `CMS_MEDIA_URL`        | empty                                 | Only for a CDN; becomes the only allowed remote image host   |
| `NEXT_PUBLIC_FILM_URL` | CDN URL of the corporate film, if any | Build time                                                   |

`next build` and `next start` refuse missing, `http://` or localhost values for the two
`NEXT_PUBLIC_*` URLs and the placeholder secret. `ALLOW_LOCAL_URLS=true` exists only for production
builds on a developer machine and must never be set on the server.

### Admin (build time)

`VITE_API_URL=/api/v1`, the default, needs no change. Nginx serves the admin and proxies `/api` on
the same domain. `VITE_SITE_URL=https://mahafeth.com` is required for the "view on site" links;
`vite build` refuses a missing, `http://` or localhost value (same `ALLOW_LOCAL_URLS` opt-out as the
website).

### What production refuses

The API exits at startup with a clear message for: placeholder `JWT_SECRET`/`REVALIDATE_SECRET`,
non-https or localhost `CORS_ORIGINS`, the `root` DB user or development DB passwords, a localhost
`MEDIA_BASE_URL`, and only one of `WEB_REVALIDATE_URL`/`REVALIDATE_SECRET`. The seed refuses the
placeholder admin password and `.local` emails. The website refuses development URLs as described
above.

## 7. Prisma migration

Production only ever applies committed migrations. **Never run `prisma migrate dev`,
`migrate reset` or `db push` against production.**

```bash
cd /srv/mahafeth/$RELEASE
pnpm db:generate
DATABASE_URL='mysql://mahafeth_admin:<pw>@127.0.0.1:3306/mahafeth' pnpm db:deploy
```

`db:deploy` runs `prisma migrate deploy`: it applies pending migrations in order, never drops data
it was not told to, and fails if the history diverges. Take a backup first (§15) when a release
contains migrations.

**First install only — seed:**

```bash
pnpm db:seed
```

The seed is idempotent. It creates the first super admin (from `SEED_ADMIN_*`), the launch
projects, services, pages and default settings only where they are missing. It never changes an
existing account (password, role or status) or content edited in the admin. Afterwards remove
`SEED_ADMIN_PASSWORD` from `shared/backend.env`.

**Verify:**

```bash
DATABASE_URL='mysql://mahafeth_admin:<pw>@127.0.0.1:3306/mahafeth' pnpm --filter @mahafeth/backend exec prisma migrate status
mysql -u mahafeth_app -p mahafeth -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM projects;"
```

## 8. Backend build

```bash
pnpm --filter @mahafeth/backend build         # tsc → apps/backend/dist
```

Start the API (§9) **before** building the website: the build reads the CMS for the sitemap. If the
API is down, the build still succeeds with fallback content and refreshes within 5 minutes.

The API checks at startup that `UPLOAD_DIR` is writable and exits otherwise. It drains connections
for up to 10 s on SIGINT/SIGTERM, then closes the DB pool.

## 9. PM2

`ecosystem.config.cjs` at the repo root defines `mahafeth-api` and `mahafeth-web`, one fork-mode
process each, with auto-restart, graceful-shutdown timeouts and logs in `/var/log/mahafeth/`.

```bash
cd /srv/mahafeth/current
pm2 start ecosystem.config.cjs --only mahafeth-api     # first install: API first
# … build the website and admin (§10, §11) …
pm2 start ecosystem.config.cjs --only mahafeth-web
pm2 save
pm2 startup systemd -u mahafeth --hp /srv/mahafeth     # prints a sudo command: run it once
sudo pm2 install pm2-logrotate                          # or a logrotate rule for /var/log/mahafeth
```

Day to day: `pm2 status`, `pm2 logs mahafeth-api`, `pm2 reload ecosystem.config.cjs --update-env`.

**Keep the API at one instance.** Rate limits, sign-in lockouts and the revalidation debounce are
in memory. Several instances (PM2 cluster mode, or more servers behind a load balancer) would
multiply the limits and split lockouts. Move that state to Redis or another shared store before
scaling out. The website (`mahafeth-web`) keeps its ISR cache on local disk, so the same applies
to it.

## 10. Website build

```bash
pnpm --filter @mahafeth/web build      # reads apps/web/.env.production.local
```

Or build everything at once with `pnpm build` (turbo: backend, web and admin). The build fails
fast if `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_API_URL` are missing or point at localhost.
`NEXT_PUBLIC_*` values are compiled in, so rebuild after changing them.

How CMS content reaches the site:

- Pages read the CMS server-side with a 5-minute cache (`revalidate: 300`, tags `cms…`).
- After every successful admin write, the API calls `WEB_REVALIDATE_URL` (debounced 500 ms).
  The website expires the `cms` tag and the next request re-reads the CMS. Lead and user changes
  are excluded because the site does not render them.
- **CMS unavailable:** every CMS read has a 3 s timeout. On failure, each page renders with the
  bundled fallback content in `src/content/fallback` and logs `[cms] … serving fallback content`
  once. Pages keep returning 200, and fresh content returns on the first successful read.
- `/sitemap.xml` (5-minute revalidation) and `/robots.txt` use `NEXT_PUBLIC_SITE_URL`.
  Canonical/hreflang URLs come from `metadataBase`.
- Share images come from the CMS (Settings → SEO → OG image, or each page's SEO image). **Set the
  global OG image before launch**: without one, pages have no `og:image`.

## 11. Admin build

```bash
pnpm --filter @mahafeth/admin build    # → apps/admin/dist (static files)
```

Nginx serves `dist` directly, with an SPA fallback so deep links such as `/settings/content`
survive a refresh. There is no admin server process.

## 12. Nginx

```bash
sudo apt-get install -y nginx
sudo cp /srv/mahafeth/current/deploy/nginx/mahafeth.conf /etc/nginx/sites-available/mahafeth.conf
sudo nano /etc/nginx/sites-available/mahafeth.conf      # domains, root path
sudo ln -s /etc/nginx/sites-available/mahafeth.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

What the config does:

- **HTTP → HTTPS:** port 80 only serves ACME challenges and 301s everything else.
  `www` redirects to the apex.
- **Website** (`mahafeth.com`):
  - Requests go to Next on `127.0.0.1:3000`; `/api/v1/` and `/uploads/` go to the API.
  - `/api/revalidate` returns 404 from outside.
  - Response headers: HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`,
    `Referrer-Policy: strict-origin-when-cross-origin`.
- **Admin** (`admin.mahafeth.com`):
  - Serves `dist` with `try_files $uri $uri/ /index.html`; `index.html` is `no-cache`.
  - `/assets/` is immutable, and missing assets get a real 404.
  - `/api/` and `/uploads/` go to the API. Uploads are streamed (`proxy_request_buffering off`),
    with `client_max_body_size 25m`.
  - Response headers: a strict CSP (`script-src 'self'`, `connect-src 'self'`,
    `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `noindex`.
- **Forwarding:**
  - Nginx sets `Host`, `X-Forwarded-Proto` and `X-Forwarded-Host`.
  - It **replaces** `X-Forwarded-For` with `$remote_addr`, so clients cannot inject a fake IP.
  - Upstream keepalive is on. The API's keep-alive timeout (65 s) is longer than Nginx's, which
    avoids sporadic 502s.
- **WebSocket-ready:** `Upgrade`/`Connection` are forwarded via a `map`. Nothing uses WebSockets
  today.

**TRUST_PROXY:** the API trusts `X-Forwarded-For` only from loopback (`TRUST_PROXY=loopback`).
That is exactly this topology: Nginx on the same host connecting from `127.0.0.1`. Do **not** set
`TRUST_PROXY=1`/`true` here. If a CDN or load balancer is ever added in front of Nginx, configure
Nginx `real_ip` for it and revisit `TRUST_PROXY` together. Otherwise every visitor shares the CDN's
IP for rate limits and the audit log, or clients can spoof their IP.

## 13. SSL

```bash
sudo apt-get install -y certbot
sudo mkdir -p /var/www/certbot
# Comment out the three `listen 443` server blocks first (no certificates yet), reload Nginx, then:
sudo certbot certonly --webroot -w /var/www/certbot -d mahafeth.com -d www.mahafeth.com
sudo certbot certonly --webroot -w /var/www/certbot -d admin.mahafeth.com
# Restore the 443 blocks:
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run      # renewal runs from the certbot systemd timer
echo 'deploy-hook = systemctl reload nginx' | sudo tee -a /etc/letsencrypt/cli.ini
```

HSTS is sent with `max-age=31536000; includeSubDomains`. Only add `preload` once every subdomain
is permanently HTTPS.

## 14. Uploads

- Stored in `UPLOAD_DIR` (`/var/lib/mahafeth/uploads`, mode 750, owner `mahafeth`), outside
  releases, so deploys and rollbacks keep media. Back it up (§15).
- **Accepted types:** JPEG, PNG, WebP, AVIF, GIF, SVG, ICO, MP4, WebM and PDF, up to
  `MAX_UPLOAD_MB`. One file per request.
- **File names:** each file is stored as `<uuid>.<ext>`, with the extension taken from the
  verified type, never from the client's name.
- **Content check:** files are checked against their magic bytes, and mismatches are deleted with
  a 415.
- **SVGs:** at most 2 MB. Any script, event handler, `foreignObject`, iframe/embed/object,
  `javascript:` URL or entity declaration is refused rather than sanitized.
- **Serving:** files are served at `/uploads/` by the API (Nginx routes it on both domains) with
  `nosniff`, immutable caching and cross-origin resource policy. SVGs also get
  `Content-Security-Policy: default-src 'none'; sandbox`, so opening one directly cannot run code.
- **Website images:** CMS media URLs stay relative (`/uploads/…`) on the website. Next's optimizer
  fetches them through its internal rewrite to `CMS_API_URL`'s origin. Remote images are limited
  to `CMS_MEDIA_URL` (empty = none), and there is no wildcard and no private-IP exception.

## 15. Backups

`pnpm backup:db`, `pnpm backup:media` and `pnpm backup` (both), plus `pnpm restore:db`. The full
procedure, retention and restore drills are in [backup-restore.md](./backup-restore.md). Backups
go to `BACKUP_DIR`, never into the repository (`backups/` is gitignored).

```cron
# crontab -e  (user mahafeth) — nightly at 02:30, keeps 14 of each
30 2 * * * cd /srv/mahafeth/current && DATABASE_URL='mysql://mahafeth_admin:<pw>@127.0.0.1:3306/mahafeth' BACKUP_DIR=/var/backups/mahafeth pnpm backup >> /var/log/mahafeth/backup.log 2>&1
```

Copy `/var/backups/mahafeth` off the server (object storage or another host) daily. Test a
restore into a scratch database monthly.

## 16. Health checks

| Check         | Command                                       | Expect                                    |
| ------------- | --------------------------------------------- | ----------------------------------------- |
| API + DB      | `curl -s http://127.0.0.1:4000/health`        | `{"status":"ok",…,"database":"ok"}`, 200  |
| Through Nginx | `curl -s https://mahafeth.com/health`         | same; 503 + `"degraded"` if MySQL is down |
| Liveness only | `curl -s http://127.0.0.1:4000/api/v1/health` | `{"status":"ok"}`                         |
| Website       | `curl -sI http://127.0.0.1:3000/ar`           | 200                                       |
| Processes     | `pm2 status`                                  | both `online`, restarts not climbing      |

`/health` returns only status, uptime, database reachability and a timestamp: no versions,
configuration, hosts or paths. It is not rate-limited and stays out of the request log, so point
an uptime monitor at `https://mahafeth.com/health`.

## 17. Smoke tests

After every deploy, from any machine:

```bash
SMOKE_WEB_URL=https://mahafeth.com SMOKE_ADMIN_URL=https://admin.mahafeth.com pnpm test:smoke
```

This is read-only. It checks:

- API health and the public API;
- `/ar` RTL and `/en` LTR, canonical/hreflang/og:image, and no localhost URLs in the HTML;
- a CMS upload served on the website origin **and** through the image optimizer;
- robots.txt and sitemap.xml, the 404 page, and that `/api/revalidate` is blocked;
- admin deep links (SPA fallback) and the admin API proxy.

Then, by hand:

1. Sign in to the admin and open each section.
2. Edit a harmless setting (e.g. the footer text) and confirm the website shows it within seconds.
   Then revert it.
3. Submit the interest form once and confirm the lead appears in the admin.
4. Check the admin **Audit log** shows the edits.

Browser-level admin routing (guards, refresh on every module, permissions, logout) can be run
against production with a test account:
`E2E_ADMIN_URL=https://admin.mahafeth.com E2E_API_URL=https://admin.mahafeth.com/api/v1 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm test:e2e:admin-routes`.
It creates and removes one temporary editor.

## 18. Rollback

Releases are immutable directories, so rolling back the code is a symlink switch:

```bash
cd /srv/mahafeth
ls -1 releases/                                  # pick the previous release
ln -sfn releases/<previous> current
cd current && pm2 reload ecosystem.config.cjs --update-env
# The admin needs nothing: Nginx serves /srv/mahafeth/current/apps/admin/dist through the symlink.
SMOKE_WEB_URL=https://mahafeth.com SMOKE_ADMIN_URL=https://admin.mahafeth.com pnpm test:smoke
```

- **No migrations in the bad release:** the code rollback above is all that is needed.
- **The bad release ran migrations:** Prisma migrations are forward-only. Prefer a fix-forward
  release. If the old code cannot run on the new schema, restore the backup taken just before the
  deploy **after** switching back: `pm2 stop mahafeth-api`, then
  `DATABASE_URL='mysql://mahafeth_admin:…' pnpm restore:db /var/backups/mahafeth/db/<file>.sql.gz --yes`,
  then `pm2 start mahafeth-api` (see backup-restore.md).
  Anything written since that backup is lost, so export new leads first.
- **Media** is outside releases and never rolled back. Restore `backup:media` archives only for
  accidental deletion.

Keep the last 5 releases: `ls -1dt releases/* | tail -n +6 | xargs rm -rf`.

---

## Deployment sequence (summary)

First install:

1. Server user and directories, firewall (§1); Node, pnpm, PM2 (§2); MySQL (§3).
2. Database and the two accounts (§4).
3. Clone the release and `pnpm install --frozen-lockfile` (§5).
4. Create `shared/backend.env` and `shared/web.env`, and link them (§6).
5. `pnpm db:generate`, then `pnpm db:deploy` with the admin account, then `pnpm db:seed` (§7).
6. Build the backend; `ln -sfn $RELEASE current`; `pm2 start … --only mahafeth-api`; check
   `curl 127.0.0.1:4000/health` (§8, §9).
7. Build the website and admin; `pm2 start … --only mahafeth-web`; `pm2 save`; `pm2 startup`
   (§10, §11, §9).
8. Nginx without the 443 blocks, then certbot, then the full config (§12, §13).
9. Smoke test (§17). Set the OG image and real contact details in the admin. Schedule backups (§15).

Each later release:

1. `pnpm backup`.
2. Clone a new release, install, link the env files.
3. `pnpm db:generate`, then `pnpm db:deploy` with the admin account.
4. `pnpm build` (the API keeps serving the old release meanwhile).
5. `ln -sfn $RELEASE current`, then `pm2 reload ecosystem.config.cjs --update-env`.
6. Smoke test. On failure, roll back (§18).
