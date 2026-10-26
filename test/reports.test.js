const mongoose = require('mongoose')
const startDatabase = require('./database')
const { User } = require('../src/models/User')
const { Report } = require('../src/models/Report')
const { Earning } = require('../src/models/Earning')
require('../src/models/ProviderReport')
const reportsCommand = require('../src/services/reports/reportsCommand').default
const earningsService = require('../src/services/earnings').default
const exchangeService = require('../src/services/exchangeRate').default
const monthNumberToString = require('../src/services/shared/monthNumberToString').default
const AppError = require('../src/services/shared/AppError').default
const errorTypes = require('../src/constants/errorTypes').default
const appErrorTypes = require('../src/constants/appErrorTypes').default

let database, user, report, container
beforeAll(async () => {
    database = await startDatabase()
    await mongoose.connect(database.getUri(), { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    user = await User.create({ email: 'report-test@example.invalid', settings: { currency: 'USD' } })
    report = await Report.create({ user, year: 2025, month: 1, status: 'completed', merchantCurrency: 'USD' })
    const definitions = [
        { providerType: 'googleplay', countryCode: 'US', units: 1, unitSalePriceMerchantCurrency: 20, unitFeeMerchantCurrency: -6, unitTaxMerchantCurrency: -2, totalEarningMerchantCurrency: 12 },
        { providerType: 'googleplay', countryCode: 'GB', units: -1, unitSalePriceMerchantCurrency: -8, unitFeeMerchantCurrency: 2.4, unitTaxMerchantCurrency: 0, totalEarningMerchantCurrency: -5.6 },
        { providerType: 'appstore', countryCode: 'FR', units: 2, unitSalePriceMerchantCurrency: 10, unitFeeMerchantCurrency: -3, unitTaxMerchantCurrency: 0, totalEarningMerchantCurrency: 14 }
    ]
    const earnings = await Earning.create(definitions.map((row, index) => ({ ...row, user, report, reportId: report.id,
        account: new mongoose.Types.ObjectId(), productId: 'com.example.demo' + index, buyerCurrency: 'USD',
        merchantCurrency: 'USD', exchangeRate: 1, year: 2025, month: 1 })))
    report.earnings = earnings
    await report.save()
    const dependencies = { User, Report, Earning, earningsService, exchangeService, monthNumberToString,
        AppError, errorTypes, appErrorTypes, logger: { info() {} }, createError: error => error }
    container = { resolve: name => dependencies[name] }
})
afterAll(async () => { await mongoose.disconnect(); if (database) await database.stop() })

test('aggregates synthetic sales/refunds using the real MongoDB 7 pipeline', async () => {
    expect((await mongoose.connection.db.admin().serverInfo()).version).toBe('7.0.45')
    const result = await reportsCommand.getReport(container, user.id, 1, 2025, 'USD')
    expect(result.notFound).toBe(false)
    expect(result.total).toMatchObject({ units: 2, sales: 32, fees: -9.6, taxes: -2, earnings: 20.4 })
    for (const group of ['perProvider', 'perCountry', 'perProduct']) {
        const sum = result[group].reduce((total, row) => total + row.earnings, 0)
        expect(sum).toBeCloseTo(result.total.earnings)
    }
    expect(result.perProvider).toHaveLength(2)
    expect(result.perCountry).toHaveLength(3)
})

test('an absent report is handled without modifying any data', async () => {
    expect(await reportsCommand.getReport(container, user.id, 2, 2025, 'USD')).toEqual({ notFound: true })
    expect(await Earning.countDocuments()).toBe(3)
})
