-- Local development only: `prisma migrate dev` creates a temporary shadow database,
-- which needs CREATE/DROP beyond the app database. Runs on a fresh volume only.
GRANT ALL PRIVILEGES ON *.* TO 'mahafeth'@'%';
FLUSH PRIVILEGES;
