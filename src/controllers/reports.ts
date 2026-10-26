import { Request, Response, NextFunction } from 'express'
import logger from '../util/logger'
import months from '../constants/months'
import { NOT_FOUND_CODE } from '../constants/errorCodes'
import formidable from 'formidable'
import { IncomingForm } from 'formidable'
import getErrorMessageFromCode from '../services/shared/getErrorMessageFromCode'
import container from '../services/servicesContainer'
import ErrorHandler from '../services/shared/ErrorHandler'

/**
 * GET /reports
 * Reports page.
 */
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id
        const error = req.query['error'] as string

        const reportsCommand: any = container.resolve('reportsCommand')
        const currencyCodes: any = container.resolve('currencyCodes')
        const subscriptionChecker: any = container.resolve('subscriptionChecker')
        const subscriptionCommand: any = container.resolve('subscriptionCommand')

        const {
            redirect,
            reports,
            year,
            defaultMonth,
            numberOfAccounts,
            numberOfReports,
            defaultMonthString,
            predictions
        } = await reportsCommand.getReports(container, userId)

        const showAmounts = await subscriptionChecker.isUserSubscriptionEnough(container, userId, numberOfAccounts)
        subscriptionCommand.updateSubscriptionDate(container, userId)

        // TEMPORARY: skip the onboarding

        // if (redirect === true) {
        //     logger.info('Redirect to accounts page because no reports and no accounts', { user: req.user.id, numberOfAccounts, numberOfReports })
        //     return res.redirect('/welcome')
        // } else {
        res.render('reports.twig', {
            title: 'Reports',
            reports,
            months: months,
            year,
            defaultMonth,
            currencyCodes,
            defaultCurrency: req.user.settings.currency,
            error: getErrorMessageFromCode(parseInt(error)),
            defaultMonthString,
            showAmounts,
            path: req.path,
            predictions,
            reportsForGraph: reports && reports.slice(0, 12) // eslint-disable-line
        })
        // }
    }
    catch (err) {
        logger.error('Error in getReports', { user: req.user.id })
        next(err)
    }
}

/**
 * POST /reports
 * Create report action
 */
export const postCreateReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const check: any = container.resolve('check')
        const validationResult: any = container.resolve('validationResult')
        const currencyCodes: any = container.resolve('currencyCodes')

        await check('year', 'Year is not valid').isInt().run(req)
        await check('month', 'Month is not valid').isIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).run(req) // eslint-disable-line
        await check('currency', 'Currency is not valid').isIn(currencyCodes).run(req)

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            req.flash('errors', errors.array())
            return res.redirect('/reports')
        }

        const userId = req.user.id
        const month = req.body.month
        const year = req.body.year
        const currency = req.body.currency

        const MONTH_OFFSET = 1
        const FIRST_DAY_OF_MONTH = 0
        const currentDate = new Date()
        const dateOfReport = new Date()
        currentDate.setDate(FIRST_DAY_OF_MONTH)
        dateOfReport.setFullYear(year)
        dateOfReport.setMonth(month - MONTH_OFFSET)

        const isReportInTheFuture = (dateOfReport > currentDate)

        if (isReportInTheFuture) {
            req.flash('errors', { msg: 'Sorry you cannot get the report of a future date' })
            return res.redirect('/reports')
        }

        const reportsCommand: any = container.resolve('reportsCommand')

        await reportsCommand.createReport(container, userId, month, year, currency)

        res.redirect(`/reports/${currency}/${year}/${month}`)
    }
    catch (err) {
        logger.error('Error in postCreateReport', { user: req.user.id })

        const isOperationalError = await ErrorHandler.handleError(err).isOperational
        if (!isOperationalError) {
            next(err)
        } else {
            const DEFAULT_CODE = 0
            const code = err && err.appType && err.appType.code ? err.appType.code : DEFAULT_CODE
            res.redirect('/reports?error=' + code)
        }
    }
}

/**
 * GET /reports/:currency/:year/:month
 * Report page for a specific year and month
 */
export const getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currency = req.params.currency
        const year = req.params.year
        const month = req.params.month
        const userId = req.user.id
        const error = req.query['error'] as string
        const user = req.user

        const reportsCommand: any = container.resolve('reportsCommand')
        const subscriptionChecker: any = container.resolve('subscriptionChecker')
        const subscriptionCommand: any = container.resolve('subscriptionCommand')

        const {
            notFound,
            formattedMonth,
            total,
            perProduct,
            perCountry,
            perProvider,
            exchangesToSet,
            report,
            showUpdateExchangeAlert,
            monthString
        } = await reportsCommand.getReport(container, userId, month, year, currency)

        if (notFound) {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Report Not Found'
            })
            return
        }

        const ZERO = 0
        await subscriptionCommand.updateSubscriptionDate(container, userId)
        await subscriptionCommand.updateUserSubscriptionInformation(container, user, total ? total.units : ZERO, month, year)

        const numberOfAccounts = report.providerReports.length
        const showAmounts = await subscriptionChecker.isUserSubscriptionEnough(container, userId, numberOfAccounts)
        let subscriptionInformation = null

        if (!showAmounts) {
            subscriptionInformation = await subscriptionChecker.getUserPlanRecommendation(container, userId)
        }

        res.render('report.twig', {
            title: 'Report',
            providers: report.providerReports,
            showUpdateExchangeAlert,
            year,
            month: formattedMonth,
            currency,
            total,
            perProduct,
            perCountry,
            perProvider,
            exchangesToSet,
            userId,
            error: getErrorMessageFromCode(parseInt(error)),
            path: req.path,
            monthString,
            showAmounts,
            subscriptionInformation
        })
    }
    catch (err) {
        logger.error('Error in getReport', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /reports/:currency/:year/:month/delete
 * Delete a report
 */
export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
    const currency = req.params.currency
    const year = req.params.year
    const month = req.params.month

    try {
        const userId = req.user.id

        const reportsCommand: any = container.resolve('reportsCommand')

        const {
            notFound
        } = await reportsCommand.deleteReport(container, userId, month, year, currency)

        if (notFound) {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Report Not Found'
            })
            return
        }

        return res.redirect('/reports')
    }
    catch (err) {
        logger.error('Error in deleteReport', { user: req.user.id })

        const isOperationalError = await ErrorHandler.handleError(err).isOperational
        if (!isOperationalError) {
            next(err)
        } else {
            const DEFAULT_CODE = 0
            const code = err && err.appType && err.appType.code ? err.appType.code : DEFAULT_CODE
            return res.redirect(`/reports/${currency}/${year}/${month}?error=${code}`)
        }
    }
}

/**
 * POST /reports/:currency/:year/:month/update
 * Update exchange rate of a report
 */
export const updateReportExchangeRate = async (req: Request, res: Response, next: NextFunction) => {
    const year = req.params.year
    const month = req.params.month
    const data = req.body
    const currency = req.params.currency

    try {
        const userId = req.user.id

        const reportsCommand: any = container.resolve('reportsCommand')

        const {
            notFound
        } = await reportsCommand.updateReportExchangeRate(container, userId, month, year, currency, data)

        if (notFound) {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Report Not Found'
            })
            return
        }

        return res.redirect(`/reports/${currency}/${year}/${month}`)
    }
    catch (err) {
        logger.error('Error in updateReportExchangeRate', { user: req.user.id })

        const isOperationalError = await ErrorHandler.handleError(err).isOperational
        if (!isOperationalError) {
            next(err)
        } else {
            const DEFAULT_CODE = 0
            const code = err && err.appType && err.appType.code ? err.appType.code : DEFAULT_CODE
            return res.redirect(`/reports/${currency}/${year}/${month}?error=${code}`)
        }
    }
}

/**
 * POST /reports/:currency/:year/:month/upload
 * Update exchange rate of a report based on a CSV file of appstore
 */
export const uploadReportExchangeRate = async (req: Request, res: Response, next: NextFunction) => {
    const currency = req.params.currency
    const year = req.params.year
    const month = req.params.month

    try {
        const userId = req.user.id
        const form: IncomingForm = new formidable.IncomingForm()

        const reportsCommand: any = container.resolve('reportsCommand')

        const result = await reportsCommand.uploadReportExchangeRate(container, userId, month, year, currency, form, req)

        if (result && result.notFound) {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Report Not Found'
            })
            return
        }

        if (result.error) {
            return res.redirect(`/reports/${currency}/${year}/${month}?error=20`)
        }

        return res.redirect(`/reports/${currency}/${year}/${month}`)
    }
    catch (err) {
        logger.error('Error in uploadReportExchangeRate', { user: req.user.id })

        const isOperationalError = await ErrorHandler.handleError(err).isOperational
        if (!isOperationalError) {
            next(err)
        } else {
            const DEFAULT_CODE = 0
            const code = err && err.appType && err.appType.code ? err.appType.code : DEFAULT_CODE
            return res.redirect(`/reports/${currency}/${year}/${month}?error=${code}`)
        }
    }
}