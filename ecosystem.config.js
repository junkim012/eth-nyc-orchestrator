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