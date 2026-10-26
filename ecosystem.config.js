// Optional PM2 process file. Provision environment and credentials privately.
module.exports = {
    apps: [{ name: 'revenual', script: 'dist/server.js', env: { NODE_ENV: 'production' } }]
}
