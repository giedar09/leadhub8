module.exports = {
  apps: [{
    name: 'leadhub8-server',
    script: 'server/index.js',
    watch: ['server'],
    ignore_watch: ['node_modules', 'client'],
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}; 