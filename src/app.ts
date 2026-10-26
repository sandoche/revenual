import express from 'express'
import compression from 'compression'  // compresses requests
import session from 'express-session'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import mongo from 'connect-mongo'
import flash from 'express-flash'
import path from 'path'
import mongoose from 'mongoose'
import passport from 'passport'
import bluebird from 'bluebird'
import i18n from 'i18n'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { MONGODB_URI, SESSION_SECRET } from './util/secrets'
import { Request, Response, NextFunction } from 'express'
import ErrorHandler from './services/shared/ErrorHandler'
import * as Sentry from '@sentry/node'
import { INTERNAL_SERVER_ERROR, NOT_FOUND_CODE } from './constants/errorCodes'
import cors from 'cors'
import { betaGate } from './config/beta'

const MongoStore = mongo(session)
const DEFAULT_PORT_NUMBER = 3000

// Controllers (route handlers)
import * as homeController from './controllers/home'
import * as userController from './controllers/user'
import * as accountsController from './controllers/accounts'
import * as reportsController from './controllers/reports'
import * as subscriptionController from './controllers/subscription'
import * as invoicesController from './controllers/invoices'
import * as settingsController from './controllers/settings'
import * as ideaslabController from './controllers/ideaslab'
import * as versionController from './controllers/version'
import * as preRegistrationController from './controllers/preRegistration'

// API keys and Passport configuration
import * as passportConfig from './config/passport'

// Create Express server
const app = express()

// Connect to MongoDB
const mongoUrl = MONGODB_URI
mongoose.Promise = bluebird

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
    console.error('MongoDB connection error. Please make sure MongoDB is running. ' + err) // eslint-disable-line
    // process.exit();
})

// Set up i18n
i18n.configure({
    locales: ['en'],
    directory: path.join(__dirname, '../locales')
})

// Express configuration
app.set('port', process.env.PORT || DEFAULT_PORT_NUMBER)
app.set('views', path.join(__dirname, '../views'))
app.set('view engine', 'twig')
app.use(compression())

app.use(betaGate)

const conditionalBodyParser = (req: Request, res: Response, next: NextFunction) => {
    if (!req.originalUrl.includes('/subscription/webhook')) {
        bodyParser.json()(req, res, next)
    } else {
        next()
    }
}
app.use(conditionalBodyParser)
app.use(bodyParser.urlencoded({ extended: true }))

export const sessionStore = new MongoStore({ url: mongoUrl, autoReconnect: true })
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: sessionStore
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
const csrf = lusca.csrf()

app.use(cors({
    origin: process.env.HOST_LANDING_PAGE,
    optionsSuccessStatus: 200,
    methods: ['POST']
}))

const conditionalCSRF = (req: Request, res: Response, next: NextFunction) => {
    if ((!(req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data'))) && !req.originalUrl.includes('/subscription/webhook') && !req.originalUrl.includes('/pre-signup')) {
        csrf(req, res, next)
    } else {
        next()
    }
}
app.use(conditionalCSRF)

app.use((req, res, next) => {
    res.locals.user = req.user
    next()
})
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path
    } else if (req.user &&
        req.path == '/account') {
        req.session.returnTo = req.path
    }
    next()
})

app.use(
    express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
)

app.use(i18n.init)

const LIMIT_TIME = 900000 // = 15 minutes
const LIMIT_MAX_QUERY = 100 // limit each IP to 100 requests per windowMs
const limiter = rateLimit({
    windowMs: LIMIT_TIME, 
    max: LIMIT_MAX_QUERY 
})
app.use(limiter)
app.use(helmet())

Sentry.init({ dsn: process.env.SENTRY_DSN || undefined, enabled: Boolean(process.env.SENTRY_DSN) })
app.use(Sentry.Handlers.requestHandler())

/**
 * Primary app routes.
 */
app.get('/', homeController.index)
app.get('/login', userController.getLogin)
app.post('/login', userController.postLogin)
app.get('/logout', userController.logout)
app.get('/forgot', userController.getForgot)
app.post('/forgot', userController.postForgot)
app.get('/reset/:token', userController.getReset)
app.post('/reset/:token', userController.postReset)
app.get('/signup', userController.getSignup)
app.post('/signup', userController.postSignup)

app.post('/settings/profile', passportConfig.isAuthenticated, userController.postUpdateProfile)
app.post('/settings/password', passportConfig.isAuthenticated, userController.postUpdatePassword)
// app.post('/settings/delete', passportConfig.isAuthenticated, userController.postDeleteAccount)

app.get('/welcome', passportConfig.isAuthenticated, accountsController.getAccounts)
app.get('/welcome/next', passportConfig.isAuthenticated, accountsController.finishOnboarding)
app.get('/accounts/add/:provider', passportConfig.isAuthenticated, accountsController.getAddAccount)
app.post('/accounts/add/:provider', passportConfig.isAuthenticated, accountsController.postAddAccount)
app.get('/accounts/:providerId/delete', passportConfig.isAuthenticated, accountsController.deleteAccount)

app.get('/reports', passportConfig.isAuthenticated, reportsController.getReports)
app.post('/reports', passportConfig.isAuthenticated, reportsController.postCreateReport)
app.get('/reports/:currency/:year/:month', passportConfig.isAuthenticated, reportsController.getReport)
app.get('/reports/:currency/:year/:month/delete', passportConfig.isAuthenticated, reportsController.deleteReport)
app.post('/reports/:currency/:year/:month/update', passportConfig.isAuthenticated, reportsController.updateReportExchangeRate)
app.post('/reports/:currency/:year/:month/upload', passportConfig.isAuthenticated, reportsController.uploadReportExchangeRate)

app.get('/invoices', passportConfig.isAuthenticated, invoicesController.getInvoices)
app.get('/invoices/:year-:month-:currency-:provider-:userId.xlsx', passportConfig.isAuthenticated, invoicesController.downloadInvoice)

app.get('/subscription', passportConfig.isAuthenticated, subscriptionController.getPlans)
app.get('/subscription/:type/:currency', passportConfig.isAuthenticated, subscriptionController.getNewSubscription)
app.get('/subscription/cancel', passportConfig.isAuthenticated, subscriptionController.getCancelSubscription)
app.get('/subscription/success', passportConfig.isAuthenticated, subscriptionController.getNewSubscriptionSuccess)
app.get('/subscription/payment-canceled', passportConfig.isAuthenticated, subscriptionController.getNewSubscriptionCancel)
app.post('/subscription/webhook', bodyParser.raw({type: 'application/json'}), subscriptionController.webhook)

app.get('/settings', passportConfig.isAuthenticated, settingsController.getSettings)
app.get('/ideas-lab', passportConfig.isAuthenticated, ideaslabController.getIdealab)

app.get('/version', versionController.getVersion)
app.post('/pre-signup', preRegistrationController.preSignup)

// Error handler middleware
app.use(Sentry.Handlers.errorHandler())

app.use((req, res, next: NextFunction) => {
    res.status(NOT_FOUND_CODE)
    res.render('error.twig', {
        code: NOT_FOUND_CODE,
        title: '404 Page Not Found'
    })
})

app.use(async (err: any, req: Request, res: Response, next: NextFunction) => {
    const isOperationalError = await ErrorHandler.handleError(err).isOperational
    
    // if (!isOperationalError) {
    //     next(err)
    // } else {
    res.status(INTERNAL_SERVER_ERROR)
    res.render('error.twig', {
        code: INTERNAL_SERVER_ERROR,
        title: '500 Server Error'
    })
    // }
})

process.on('unhandledRejection', (reason, p) => {
    throw reason
})

process.on('uncaughtException', async (err) => {
    const isTrustedError = await ErrorHandler.handleError(err).isTrustedError
    
    if (!isTrustedError) {
        process.exit(1) // eslint-disable-line
    }
})

export default app
