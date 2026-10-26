import { UserDocument } from '../../models/User'
import { ReportDocument } from '../../models/Report'
import { EarningDocument } from '../../models/Earning'
import { ProviderReportDocument } from '../../models/ProviderReport'
import { ProviderExchangeRate } from '../exchangeRate/ProviderExchangeRate/ProviderExchangeRate'
import mongoose from 'mongoose'
import { AwilixContainer } from 'awilix'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import getPredictions from './utils/getPredictions'

const createReport = async (container: AwilixContainer, userId: string, month: number, year: number, currency: string): Promise<void> => {
    const errorTypes: any = container.resolve('errorTypes')
    const AppError: any = container.resolve('AppError')
    const appErrorTypes: any = container.resolve('appErrorTypes')
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const ProviderReport: mongoose.Model<ProviderReportDocument> = container.resolve('ProviderReport')
        const accountsFactory: any = container.resolve('accountsFactory')
        const reportsFactory: any = container.resolve('reportsFactory')

        logger.info('Getting user with accounts', { user: userId })
        const user = await User.findOne({ _id: userId }).populate('accounts').exec()

        logger.info('Redirect if report already existing', { user: userId, month, year, currency })
        const existingReport = await Report.findOne({ user, month, year, merchantCurrency: currency, status: 'completed' }).exec()

        if (existingReport) {
            logger.info('Report already exist, redirecting', { user: userId, month, year, currency })
            throw new AppError(errorTypes.ValidationError, appErrorTypes.ExistingReport, 'Report already exist, redirecting', true, true, { userId })
        }

        logger.info('Getting all the accounts added and their validity', { user: userId })
        const accounts = user.accounts
        const invalidAccounts = await accountsFactory.getInvalidAccounts(accounts)
        const NONE = 0
        if (invalidAccounts.length > NONE) {
            throw new AppError(errorTypes.ValidationError, appErrorTypes.ExpiredAccount, 'One of the account is expired', true, true, { userId })
        }
        if (accounts.length === NONE) {
            throw new AppError(errorTypes.ValidationError, appErrorTypes.AccountRequired, 'No accounts found', true, true, { userId })
        }

        logger.info('Getting the reportable accounts', { user: userId })
        const reportableAccounts = reportsFactory.getReportableAccounts(accounts, month, year)

        logger.info('Creating a new report')
        const report = new Report({
            createdAt: new Date(),
            year,
            month,
            status: 'pending',
            user,
            merchantCurrency: currency
        })

        logger.info('Adding report to the database')
        await report.save()

        logger.info('Adding report to the user')
        if (Array.isArray(user.reports)) {
            user.reports.push(report)
        } else {
            user.reports = [report]
        }

        logger.info('Saving user to the database')
        await user.save()
        const earningList = []

        for (const reportableAccount of reportableAccounts) {
            logger.info('Downloading report', { account: reportableAccount.id })
            await reportableAccount.download()

            logger.info('Creating new report', { account: reportableAccount.id })
            const providerReport = new ProviderReport({
                createdAt: new Date(),
                year,
                month,
                providerType: reportableAccount.type,
                data: reportableAccount.reportData,
                accountId: reportableAccount.id,
                account: reportableAccount._id,
                report: report
            })

            logger.info('Saving report', { account: reportableAccount.id, providerType: reportableAccount.type, accountId: reportableAccount.id })
            await providerReport.save()

            logger.info('Adding providerReports to the report')
            if (Array.isArray(report.providerReports)) {
                report.providerReports.push(providerReport)
            } else {
                report.providerReports = [providerReport]
            }

            logger.info('Saving report to the database')
            await report.save()

            logger.info('Create a parsable report and run parse()')
            const parsableProviderReport = reportsFactory.getParsableProviderReport(container, providerReport, currency)
            await parsableProviderReport.parse()

            logger.info('Saving earnings to the database', { numberOfEarnings: parsableProviderReport.report.earnings.length })

            for (let earning of parsableProviderReport.report.earnings) {
                await earning.save()
                user.earnings.push(earning)
                earningList.push(earning)
            }
            await user.save()
        }
        report.earnings = [...earningList]

        logger.info('Update report status and save it', { reportId: report._id.toString() })
        report.status = 'completed'
        await report.save()
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const getReports = async (container: AwilixContainer, userId: string): Promise<any> => {
    const createError: any = container.resolve('createError')

    try {
        const accountsFactory: any = container.resolve('accountsFactory')
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Earning: mongoose.Model<EarningDocument> = container.resolve('Earning')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const monthNumberToString: any = container.resolve('monthNumberToString')

        logger.info('Checking number of reports', { user: userId })
        const user = await User.findOne({ _id: userId }).populate('accounts').exec()

        const DECIMALS = 2

        const reports = await Earning.aggregate([
            {
                $match: {
                    user: user._id
                }
            },
            {
                $group: {
                    _id: {
                        user: '$user',
                        report: '$report'
                    },
                    units: { $sum: '$units' },
                    salesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitSalePriceMerchantCurrency'] } },
                    feesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitFeeMerchantCurrency'] } },
                    taxesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitTaxMerchantCurrency'] } },
                    earningsFull: { $sum: '$totalEarningMerchantCurrency' }
                },
            },
            {
                $project: {
                    _id: '$_id',
                    units: '$units',
                    sales: { $round: ['$salesFull', DECIMALS] },
                    fees: { $round: ['$feesFull', DECIMALS] },
                    taxes: { $round: ['$taxesFull', DECIMALS] },
                    earnings: { $round: ['$earningsFull', DECIMALS] },
                    report: '$_id.report',
                }
            },
            {
                $lookup: {
                    from: 'reports',
                    localField: 'report',
                    foreignField: '_id',
                    as: 'report_doc'
                }
            }
        ]).exec()

        const reportsWithoutSales: ReportDocument[] = await Report.aggregate([
            {
                $addFields: {
                    numberOfEarnings: { $size: '$earnings' },
                }
            },
            {
                $match: {
                    user: user._id,
                    status: 'completed',
                    numberOfEarnings: { $lt: 1 }
                }
            }
        ]).exec()

        const reportsCompleted = reports.filter((item: any) => {
            // injection protected because constant
            return item.report_doc && item.report_doc[0] && item.report_doc[0].status === 'completed' // eslint-disable-line
        })

        const reportsDetailed = reportsCompleted.map((item: any) => {
            // injection protected because constant
            item.report_data = item.report_doc[0] // eslint-disable-line
            item.report_data.monthString = monthNumberToString(item.report_data.month)

            return item
        })

        const reportsZeroEarnings = reportsWithoutSales.map(item => {
            return {
                earnings: 0,
                report_data: { // eslint-disable-line
                    ...item,
                    monthString: monthNumberToString(item.month)
                }
            }
        })

        const reportsMerged = reportsDetailed.concat(reportsZeroEarnings)

        const reportsSorted = reportsMerged.sort((a: any, b: any) => {
            const dateA = new Date()
            dateA.setFullYear(a.report_data.year)
            dateA.setMonth(a.report_data.month)

            const dateB = new Date()
            dateB.setFullYear(b.report_data.year)
            dateB.setMonth(b.report_data.month)

            return dateB.getTime() - dateA.getTime()
        })

        const predictions = getPredictions(reportsSorted)

        const numberOfAccounts = user.accounts.length
        const numberOfReports = reportsSorted.length
        const NONE = 0

        // TEMPORARY: skip the onboarding
        // eslint-disable-next-line
        if (numberOfAccounts === NONE && numberOfReports === NONE && false) {
            return { redirect: true }
        }
        else {
            const dateOneMonthAgo = new Date()
            const MONTH_OFFSET_1 = 1
            const MONTH_OFFSET_2 = 2
            const DAY_OF_MONTH_10 = 10

            if (dateOneMonthAgo.getDate() > DAY_OF_MONTH_10) {
                dateOneMonthAgo.setMonth(dateOneMonthAgo.getMonth() - MONTH_OFFSET_1)
            } else {
                dateOneMonthAgo.setMonth(dateOneMonthAgo.getMonth() - MONTH_OFFSET_2)
            }
            accountsFactory.refreshTokens(user.accounts)

            return {
                redirect: false,
                reports: reportsSorted,
                year: dateOneMonthAgo.getFullYear(),
                defaultMonth: dateOneMonthAgo.getMonth() + MONTH_OFFSET_1,
                defaultMonthString: monthNumberToString(dateOneMonthAgo.getMonth() + MONTH_OFFSET_1),
                numberOfAccounts,
                numberOfReports,
                predictions
            }
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const getReport = async (container: AwilixContainer, userId: string, month: number, year: number, currency: string): Promise<any> => {
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const exchangeService: any = container.resolve('exchangeService')
        const earningsService: any = container.resolve('earningsService')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const monthNumberToString: any = container.resolve('monthNumberToString')

        logger.info('Getting user', { user: userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting report informations', { year, month, user: userId })
        const report = await Report.findOne({ year, month, merchantCurrency: currency, user, status: 'completed' }).populate('providerReports').populate('earnings').exec()

        if (!report) {
            return { notFound: true }
        }

        const reportId: string = report._id.toString()
        const exchangesToSet = exchangeService.getExchangesFromEarnings(report.earnings)
        const total = await earningsService.getTotal(container, reportId, user, report)
        const perProduct = await earningsService.getPerProduct(container, reportId, user, report)
        const perProvider = await earningsService.getPerProvider(container, reportId, user, report)
        const perCountry = await earningsService.getPerCountry(container, reportId, user, report)

        const START_SLICE = -2
        const formattedMonth = ('0' + month).slice(START_SLICE)
        const monthString = monthNumberToString(month)

        const ZERO = 0
        const numberOfAppleProviders = report.providerReports.reduce((total, report) => {
            if (report.providerType === 'appstore') {
                total++
            }
            return total
        }, ZERO)
        const showUpdateExchangeAlert = typeof report.exchangeRateUpdate === 'undefined' && numberOfAppleProviders > ZERO

        return {
            notFound: false,
            formattedMonth,  // injection protected because coming from Earning Service
            total: total[0], // eslint-disable-line
            perProduct,
            perCountry,
            perProvider,
            exchangesToSet,
            showUpdateExchangeAlert,
            report,
            monthString
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const deleteReport = async (container: AwilixContainer, userId: string, month: number, year: number, currency: string): Promise<any> => {
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')

        logger.info('Getting user', { user: userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting report informations', { year, month, currency, userId })
        const report = await Report.findOne({ year, month, merchantCurrency: currency, user, status: 'completed' }).populate('earnings').populate('providerReports').exec()

        if (!report) {
            return { notFound: true }
        }

        logger.info('Removing earnings', { year, month, currency, user: userId })
        for (const earning of report.earnings) {
            await earning.remove()
        }

        logger.info('Removing provider reports', { year, month, currency, user: userId })
        for (const providerReport of report.providerReports) {
            await providerReport.remove()
        }

        logger.info('Removing report', { year, month, currency, user: userId })
        await report.remove()

        return {
            notFound: false
        }

    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const updateReportExchangeRate = async (container: AwilixContainer, userId: string, month: number, year: number, currency: string, data: any): Promise<any> => {
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const exchangeService: any = container.resolve('exchangeService')

        logger.info('Getting user', { userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting report informations', { year, month, currency, user: userId })
        const report = await Report.findOne({ year, month, merchantCurrency: currency, user, status: 'completed' }).populate('earnings').populate('providerReports').exec()

        if (!report) {
            return { notFound: true }
        }

        const exchangesToSet: ProviderExchangeRate[] = exchangeService.getExchangesFromEarnings(report.earnings)
        const exchangesReceived: ProviderExchangeRate[] = exchangeService.getExchangesFromPost(exchangesToSet, data)
        await exchangeService.updateExchangesOfEarnings(report.earnings, exchangesReceived)

        logger.info('Update report exchange rate update date', { year, month, currency, user: userId })
        report.exchangeRateUpdate = new Date()
        await report.save()

        return {
            notFound: false
        }

    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const uploadReportExchangeRate = async (container: AwilixContainer, userId: string, month: number, year: number, currency: string, form: IncomingForm, req: any): Promise<any> => {
    const createError: any = container.resolve('createError')
    const errorTypes: any = container.resolve('errorTypes')
    const AppError: any = container.resolve('AppError')
    const appErrorTypes: any = container.resolve('appErrorTypes')

    try {
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const exchangeService: any = container.resolve('exchangeService')

        logger.info('Getting user', { userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting report informations', { year, month, currency, user: userId })
        const report = await Report.findOne({ year, month, merchantCurrency: currency, user, status: 'completed' }).populate('earnings').populate('providerReports').exec()

        if (!report) {
            return { notFound: true }
        }

        return new Promise((resolve) => {
            form.parse(req, async (err: any, fields: any, files) => { // eslint-disable-line
                if (err) {
                    throw new AppError(errorTypes.Error, appErrorTypes.FileNotFound, 'Could not get uploaded file', true, true, { userId: req.user.id }, err)
                }

                // injection protected because coming from library
                for (const file of Object.entries(files)) {
                    if (file[1].size === 0) { // eslint-disable-line
                        resolve({ error: 'No csv uploaded' })
                        break
                    }

                    const data = fs.readFileSync(file[1].path, 'utf8') // eslint-disable-line
                    const csvData = data.toString()

                    const exchangesToSet: ProviderExchangeRate[] = exchangeService.getExchangesFromEarnings(report.earnings)
                    const exchangesFromFile: ProviderExchangeRate[] = exchangeService.getExchangesFromCsv(exchangesToSet, csvData, 'appstore')
                    await exchangeService.updateExchangesOfEarnings(report.earnings, exchangesFromFile)

                    logger.info('Update report exchange rate update date', { year, month, currency, user: userId })
                    report.exchangeRateUpdate = new Date()
                    await report.save()

                    break
                }

                resolve({
                    notFound: false
                })
            })
        })
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

export default {
    createReport,
    getReports,
    getReport,
    deleteReport,
    updateReportExchangeRate,
    uploadReportExchangeRate
}