const crypto = require('crypto')
jest.mock('../src/util/logger', () => ({ __esModule: true, default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() } }))

// Tests never load .env or inherit real integration credentials.
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex')
process.env.HOST_APP = 'http://localhost:3000'
process.env.HOST_LANDING_PAGE = process.env.HOST_APP
process.env.BASIC_AUTH_PRIVATE_BETA = 'FALSE'
for (const name of ['MONGODB_URI', 'MONGODB_URI_LOCAL', 'MONGODB_URI_TEST',
    'GOOGLE_APPLICATION_CREDENTIALS', 'BASIC_AUTH_USERNAME', 'BASIC_AUTH_PASSWORD',
    'STRIPE_SECRET_KEY', 'STRIPE_PUBLIC_KEY', 'STRIPE_WEBHOOK_SECRET_KEY',
    'MAILJET_USER', 'MAILJET_PASSWORD', 'MAILJET_FROM_EMAIL', 'SENTRY_DSN']) {
    delete process.env[name]
}
