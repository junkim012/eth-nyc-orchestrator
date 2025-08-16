module.exports = {
  apps: [
    {
      name: 'orchestrator-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    },
    {
      name: 'pocketbase',
      script: './pocketbase',
      args: 'serve --http=0.0.0.0:8090',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/pocketbase-error.log',
      out_file: './logs/pocketbase-out.log',
      log_file: './logs/pocketbase-combined.log',
      time: true
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/master',
      repo: 'YOUR_REPO_URL',
      path: '/home/root/orchestrator',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};