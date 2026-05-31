module.exports = {
  apps: [{
    name: 'superadmin-backend',
    script: 'src/server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
    },
  }],
}
