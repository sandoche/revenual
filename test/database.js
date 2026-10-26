const { MongoMemoryServer } = require('mongodb-memory-server-core')

// No caller-supplied URI and no application .env. Each instance owns its data.
module.exports = async () => MongoMemoryServer.create({
    binary: { version: '7.0.45' },
    instance: { dbName: 'revenual_test', ip: '127.0.0.1' }
})
