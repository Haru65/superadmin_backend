module.exports = {
  apps: [{
    name: 'superadmin-backend',
    script: 'src/server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 5000,
    },
    max_restarts: 10,
    restart_delay: 3000,
  }],
}
