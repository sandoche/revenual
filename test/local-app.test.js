const request = require('supertest')
const crypto = require('crypto')
const mongoose = require('mongoose')
const startDatabase = require('./database')
let database, app, sessionStore

beforeAll(async () => {
    database = await startDatabase()
    process.env.MONGODB_URI_LOCAL = database.getUri()
    const application = require('../src/app')
    app = application.default
    sessionStore = application.sessionStore
    if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve, reject) => { mongoose.connection.once('open', resolve); mongoose.connection.once('error', reject) })
    }
})
afterAll(async () => {
    if (sessionStore) await sessionStore.close()
    await mongoose.disconnect()
    if (database) await database.stop()
})
const csrf = response => {
    const match = response.text.match(/name="_csrf" value="([^"]+)"/)
    expect(match).not.toBeNull()
    return match[1]
}

test('signup, logout and login work without any external API keys', async () => {
    const agent = request.agent(app)
    const email = 'local-smoke@example.invalid'
    const password = crypto.randomBytes(20).toString('hex')
    const signup = await agent.get('/signup').expect(200)
    await agent.post('/signup').type('form').send({ _csrf: csrf(signup), email, password, confirmPassword: password }).expect(302).expect('Location', '/welcome')
    await agent.get('/welcome').expect(200)
    await agent.get('/welcome/next').expect(302).expect('Location', '/reports')
    await agent.get('/reports').expect(200)
    await agent.get('/accounts/add/googleplay').expect(200).then(response => expect(response.text).toMatch(/not configured/))
    await agent.get('/logout').expect(302)
    const login = await agent.get('/login').expect(200)
    await agent.post('/login').type('form').send({ _csrf: csrf(login), email, password }).expect(302)
    await agent.get('/reports').expect(200)
    const User = mongoose.model('User')
    const user = await User.findOne({ email })
    expect(user.password).not.toBe(password)
})

test('the beta gate uses only configured credentials', async () => {
    process.env.BASIC_AUTH_PRIVATE_BETA = 'TRUE'
    process.env.BASIC_AUTH_USERNAME = 'local-beta'
    process.env.BASIC_AUTH_PASSWORD = crypto.randomBytes(20).toString('hex')
    await request(app).get('/login').expect(401)
    await request(app).get('/login').auth(process.env.BASIC_AUTH_USERNAME, process.env.BASIC_AUTH_PASSWORD).expect(200)
    process.env.BASIC_AUTH_PRIVATE_BETA = 'FALSE'
})
