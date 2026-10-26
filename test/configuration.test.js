const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const { validateEnvironment } = require('../src/config/environment')
const { readGoogleCredentials, getGoogleAccountDisplay } = require('../src/config/google')

jest.mock('gtoken', () => ({ GoogleToken: jest.fn() }))
const { GoogleToken } = require('gtoken')
const { getToken } = require('../src/services/shared/getGoogleplayToken')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'revenual-config-'))
const keyFile = path.join(directory, 'service-account.json')
const key = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' })
const valid = { type: 'service_account', client_email: 'report-reader@synthetic-project.iam.gserviceaccount.com', private_key: key }
const strongSecret = () => crypto.randomBytes(32).toString('hex')

afterEach(() => { delete process.env.GOOGLE_APPLICATION_CREDENTIALS; jest.clearAllMocks() })
afterAll(() => { if (fs.existsSync(keyFile)) fs.unlinkSync(keyFile); fs.rmdirSync(directory) })

test('requires a non-example session secret and beta credentials only when enabled', () => {
    for (const SESSION_SECRET of [undefined, '', 'short', 'replace-this-value-with-a-generated-secret']) {
        expect(() => validateEnvironment({ SESSION_SECRET })).toThrow(/SESSION_SECRET/)
    }
    expect(() => validateEnvironment({ SESSION_SECRET: strongSecret() })).not.toThrow()
    expect(() => validateEnvironment({ SESSION_SECRET: strongSecret(), BASIC_AUTH_PRIVATE_BETA: 'TRUE' })).toThrow(/BASIC_AUTH/)
    expect(() => validateEnvironment({ SESSION_SECRET: strongSecret(), BASIC_AUTH_PRIVATE_BETA: 'TRUE', BASIC_AUTH_USERNAME: 'local-tester', BASIC_AUTH_PASSWORD: strongSecret() })).not.toThrow()
})

test('missing, missing-file, malformed and invalid keys produce safe errors', async () => {
    expect(() => readGoogleCredentials()).toThrow(/not configured/)
    expect(getGoogleAccountDisplay()).toEqual({ serviceAccountEmail: '', googleConfigurationError: 'Google Play reporting is not configured.' })
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFile
    expect(() => readGoogleCredentials()).toThrow(/could not be read/)
    fs.writeFileSync(keyFile, '{private-marker')
    expect(() => readGoogleCredentials()).toThrow(/could not be read/)
    fs.writeFileSync(keyFile, 'null')
    expect(() => readGoogleCredentials()).toThrow(/invalid/)
    fs.writeFileSync(keyFile, JSON.stringify({ type: 'user', private_key: 'private-marker' }))
    expect(() => readGoogleCredentials()).toThrow(/invalid/)
    await expect(getToken()).rejects.toThrow(/invalid/)
    expect(GoogleToken).not.toHaveBeenCalled()
})

test('uses the configured absolute or relative file and displays its own email', () => {
    fs.writeFileSync(keyFile, JSON.stringify(valid))
    for (const filename of [keyFile, path.relative(process.cwd(), keyFile)]) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = filename
        expect(readGoogleCredentials()).toEqual({ keyFile, email: valid.client_email })
        expect(getGoogleAccountDisplay().serviceAccountEmail).toBe(valid.client_email)
    }
})

test('authenticates lazily and never exposes upstream authentication errors', async () => {
    fs.writeFileSync(keyFile, JSON.stringify(valid))
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFile
    GoogleToken.mockImplementation(() => ({ getToken: async () => ({ access_token: 'synthetic' }) }))
    expect(await getToken()).toBe('synthetic')
    expect(GoogleToken).toHaveBeenCalledWith({ keyFile, scope: ['https://www.googleapis.com/auth/devstorage.read_only'] })
    GoogleToken.mockImplementation(() => ({ getToken: async () => { throw new Error('private-marker') } }))
    await expect(getToken()).rejects.toThrow('Google Play authentication failed.')
    try { await getToken() } catch (error) { expect(error.message).not.toMatch(/private-marker/) }
})
