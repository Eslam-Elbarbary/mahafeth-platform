# Backups and production restore

The platform keeps its state in two places, and both must be backed up together:

| What                                                                     | Where                                            | Backup              |
| ------------------------------------------------------------------------ | ------------------------------------------------ | ------------------- |
| Database (content, settings, users, leads, audit log, migration history) | MySQL `DATABASE_URL`                             | `pnpm backup:db`    |
| Uploaded media (images, videos, PDFs)                                    | `apps/backend/<UPLOAD_DIR>` (default `uploads/`) | `pnpm backup:media` |

Media rows in the database point at files in the upload folder by name, so restore a database
backup together with a media archive taken at (or after) the same time.

## Taking backups

```bash
pnpm backup          # database, then media
pnpm backup:db       # database only  → backups/db/<db>-YYYYMMDD-HHMMSS.sql.gz
pnpm backup:media    # uploads only   → backups/media/uploads-YYYYMMDD-HHMMSS.tar.gz
```

Each backup gets a `.sha256` file next to it (`sha256sum -c <file>.sha256` verifies it), and only
the newest 14 of each kind are kept.

| Setting                      | Default                  | Meaning                                                                                                                         |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`, `UPLOAD_DIR` | from `apps/backend/.env` | What to back up                                                                                                                 |
| `BACKUP_DIR` / `--out=<dir>` | `./backups`              | Where backups are written                                                                                                       |
| `BACKUP_KEEP` / `--keep=<n>` | `14`                     | How many backups of each kind to keep                                                                                           |
| `MYSQL_DOCKER_CONTAINER`     | —                        | Run `mysqldump`/`mysql` inside this container (e.g. `mahafeth-mysql`) when the MySQL client tools are not installed on the host |

Requirements: Node 22+, `tar` (bundled with Linux, macOS and Windows 10+), and the MySQL client
tools (`mysqldump`, `mysql`) or `MYSQL_DOCKER_CONTAINER`. The database user needs `SELECT`,
`SHOW VIEW`, `TRIGGER` and `LOCK TABLES`; the dump uses `--single-transaction`, so the site stays
online while it runs. The password is passed in `MYSQL_PWD`, never on the command line.

### Production schedule

Run the backups daily and copy them **off the server** (object storage, another host). A backup that
only lives on the same disk does not survive losing that disk.

```cron
# /etc/cron.d/mahafeth — 03:15 every night, as the user that owns the app
15 3 * * * deploy cd /srv/mahafeth-platform && BACKUP_DIR=/var/backups/mahafeth pnpm backup >> /var/log/mahafeth-backup.log 2>&1
45 3 * * * deploy rclone copy /var/backups/mahafeth remote:mahafeth-backups
```

Database dumps contain personal data (leads) and password hashes: keep the backup folder readable by
the app user only (`chmod 700`) and encrypt the off-site copy. `backups/` is git-ignored.

## Restoring in production

Restoring **replaces** the current data. Take a fresh backup of the current state first, even if it
is broken, so the restore can be undone.

1. **Pick the backup pair.** Choose the database dump and the media archive closest to the target
   time (the media archive should not be older than the dump).

2. **Verify the files.**

   ```bash
   cd /var/backups/mahafeth
   sha256sum -c db/mahafeth-20261001-031500.sql.gz.sha256
   sha256sum -c media/uploads-20261001-031500.tar.gz.sha256
   ```

3. **Stop the API** so nothing writes during the restore (the website keeps serving cached pages).

   ```bash
   pm2 stop mahafeth-api        # or: systemctl stop mahafeth-api
   ```

4. **Back up the current state.**

   ```bash
   cd /srv/mahafeth-platform
   pnpm backup --out=/var/backups/mahafeth/before-restore
   ```

5. **Restore the database.** Every table in the dump is dropped and recreated. The database itself
   must exist (it does on an existing server; on a new server create it first, see below).

   ```bash
   pnpm restore:db /var/backups/mahafeth/db/mahafeth-20261001-031500.sql.gz --yes
   ```

   Without `--yes` the script only prints what it would replace. It verifies the `.sha256` file
   before touching the database.

6. **Restore the media.** Extract into a fresh folder, then swap it in, so a failed extraction never
   leaves a half-restored folder:

   ```bash
   cd /srv/mahafeth-platform/apps/backend
   mkdir uploads.restore
   tar -xzf /var/backups/mahafeth/media/uploads-20261001-031500.tar.gz -C uploads.restore
   mv uploads uploads.old && mv uploads.restore uploads
   ```

   Remove `uploads.old` once the site is confirmed working.

7. **Apply newer migrations.** If the code is newer than the backup, bring the schema up to date
   (no-op otherwise):

   ```bash
   pnpm db:deploy
   ```

8. **Start the API and check.**

   ```bash
   pm2 start mahafeth-api
   curl -fsS https://api.example.com/api/v1/health
   ```

   Then sign in to the admin, open a project with images, and check the website home page.
   Revalidate the website cache (save any setting in the admin, or restart the website) so it
   stops serving pages cached from before the restore.

### Restoring onto a new server

Create the database and user first (as MySQL root), then follow the steps above from step 5:

```sql
CREATE DATABASE mahafeth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mahafeth'@'localhost' IDENTIFIED BY '<strong password>';
GRANT ALL PRIVILEGES ON mahafeth.* TO 'mahafeth'@'localhost';
```

Set `DATABASE_URL`, `UPLOAD_DIR` and a **new** `JWT_SECRET` in `apps/backend/.env` (a new secret
signs everyone out, which is what you want after moving servers).

### Restoring without the scripts

The backups are standard formats, so the plain tools work too:

```bash
gunzip -c mahafeth-20261001-031500.sql.gz | mysql --default-character-set=utf8mb4 -u mahafeth -p mahafeth
tar -xzf uploads-20261001-031500.tar.gz -C apps/backend/uploads
```

## Test the restore

A backup that has never been restored is a guess. Once a month, restore the latest pair into a
scratch database and compare row counts:

```bash
mysql -u root -p -e "CREATE DATABASE mahafeth_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
DATABASE_URL="mysql://root:<password>@localhost:3306/mahafeth_restore_test" \
  pnpm restore:db backups/db/<latest>.sql.gz --yes
mysql -u root -p -e "SELECT COUNT(*) FROM mahafeth_restore_test.projects; SELECT COUNT(*) FROM mahafeth.projects"
mysql -u root -p -e "DROP DATABASE mahafeth_restore_test"
```
