import { createContainer, asValue } from 'awilix'
import { check, sanitize, validationResult } from 'express-validator'
import logger from '../util/logger'
import { User } from '../models/User'
import { Account } from '../models/Account'
import { Report } from '../models/Report'
import { PreRegisteredUser } from '../models/PreRegisteredUser'
import { ProviderReport } from '../models/ProviderReport'
import { currencyCodes } from '../constants/currencies'
import { Earning } from '../models/Earning'
import { Subscription } from '../models/Subscription'
import AppError from '../services/shared/AppError'
import errorTypes from '../constants/errorTypes'
import appErrorTypes from '../constants/appErrorTypes'
import accountsFactory from './accounts/accountsFactory'
import reportsFactory from '../services/reports/reportsFactory'
import invoicesFactory from '../services/invoices/invoicesFactory'
import exchangeService from '../services/exchangeRate'
import earningsService from '../services/earnings'
import createError from '../services/shared/errorFactory'
import reportsCommand from '../services/reports/reportsCommand'
import invoicesCommand from '../services/invoices/invoicesCommand'
import accountsCommand from '../services/accounts/accountsCommand'
import { providers } from '../config/providers'
import { parseUri } from '../services/shared/googleplayUriParser'
import exchangeRateService from '../services/exchangeRate'
import monthNumberToString from '../services/shared/monthNumberToString'
import subscriptionFactory from '../services/subscription/subscriptionFactory'
import subscriptionCommand from '../services/subscription/subscriptionCommand'
import subscriptionChecker from '../services/subscription/subscriptionChecker'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const container = createContainer()

container.register({
    logger: asValue(logger),
    User: asValue(User),
    Report: asValue(Report),
    Earning: asValue(Earning),
    AppError: asValue(AppError),
    errorTypes: asValue(errorTypes),
    appErrorTypes: asValue(appErrorTypes),
    accountsFactory: asValue(accountsFactory),
    reportsFactory: asValue(reportsFactory),
    ProviderReport: asValue(ProviderReport),
    exchangeService: asValue(exchangeService),
    earningsService: asValue(earningsService),
    createError: asValue(createError),
    reportsCommand: asValue(reportsCommand),
    currencyCodes: asValue(currencyCodes),
    invoicesFactory: asValue(invoicesFactory),
    invoicesCommand: asValue(invoicesCommand),
    accountsCommand: asValue(accountsCommand),
    providers: asValue(providers),
    parseUri: asValue(parseUri),
    Account: asValue(Account),
    exchangeRateService: asValue(exchangeRateService),
    monthNumberToString: asValue(monthNumberToString),
    check: asValue(check),
    sanitize: asValue(sanitize),
    validationResult: asValue(validationResult),
    subscriptionFactory: asValue(subscriptionFactory),
    subscriptionCommand: asValue(subscriptionCommand),
    stripe: asValue(stripe),
    Subscription: asValue(Subscription),
    subscriptionChecker: asValue(subscriptionChecker),
    PreRegisteredUser: asValue(PreRegisteredUser)
})

export default container