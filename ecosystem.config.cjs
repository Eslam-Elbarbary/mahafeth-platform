/**
 * PM2 process file for production (see docs/production-deployment.md, section 9).
 *
 *   pm2 start ecosystem.config.cjs          # first start
 *   pm2 reload ecosystem.config.cjs         # after a deploy
 *   pm2 save && pm2 startup                 # survive reboots
 *
 * Environment comes from apps/backend/.env and apps/web/.env.production.local (never from this
 * file), so it holds no secrets.
 *
 * The API runs as ONE process on purpose: rate limits, sign-in lockouts and the revalidation
 * debounce live in memory. Running several instances (cluster mode or several servers) multiplies
 * every limit and splits lockouts between processes; move that state to Redis or another shared
 * store first.
 */
module.exports = {
  apps: [
    {
      name: 'mahafeth-api',
      cwd: './apps/backend',
      script: 'dist/server.js',
      exec_mode: 'fork',
      instances: 1,
      env: { NODE_ENV: 'production' },
      // Signals readiness with process.send('ready') once listening.
      wait_ready: true,
      listen_timeout: 15000,
      // The API drains connections for up to 10 s on SIGINT before forcing exit.
      kill_timeout: 12000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      exp_backoff_restart_delay: 200,
      max_memory_restart: '512M',
      time: true,
      out_file: '/var/log/mahafeth/api.out.log',
      error_file: '/var/log/mahafeth/api.err.log',
      merge_logs: true,
    },
    {
      name: 'mahafeth-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000 --hostname 127.0.0.1',
      exec_mode: 'fork',
      instances: 1,
      env: { NODE_ENV: 'production' },
      kill_timeout: 10000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      exp_backoff_restart_delay: 200,
      max_memory_restart: '1G',
      time: true,
      out_file: '/var/log/mahafeth/web.out.log',
      error_file: '/var/log/mahafeth/web.err.log',
      merge_logs: true,
    },
  ],
};
