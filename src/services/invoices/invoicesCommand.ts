import { AwilixContainer } from 'awilix'
import { UserDocument } from '../../models/User'
import mongoose from 'mongoose'
import { ReportDocument } from '../../models/Report'

const getAllInvoices = async (container: AwilixContainer, userId: string) => {
    const createError: any = container.resolve('createError')

    try {
        const logger: any = container.resolve('logger')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const monthNumberToString: any = container.resolve('monthNumberToString')

        logger.info('Getting user', { userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting all the reports', { user: userId })
        const reports = await Report.find({
            user,
            status: 'completed'
        }).populate({
            path: 'providerReports'
        }).exec()
        
        logger.info('Getting invoices names', { user: userId })
        const invoices = []

        for (const report of reports) {
            for (const providerReport of report.providerReports) {
                invoices.push({
                    providerType: providerReport.providerType,
                    month: report.month,
                    year: report.year,
                    currency: report.merchantCurrency,
                    userId,
                    monthString: monthNumberToString(report.month)
                })
            }
        }

        const invoicesSorted = invoices.sort((a: any, b: any) => {
            const dateA = new Date()
            dateA.setFullYear(a.year)
            dateA.setMonth(a.month)

            const dateB = new Date()
            dateB.setFullYear(b.year)
            dateB.setMonth(b.month)

            return dateB.getTime() - dateA.getTime()
        })

        return { invoices: invoicesSorted }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const downloadInvoice = async (container: AwilixContainer, userId: string, year: number, month: number, currency: string, providerType: string) => {
    const createError: any = container.resolve('createError')

    try {
        const ZERO = 0
        const logger: any = container.resolve('logger')
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const Report: mongoose.Model<ReportDocument> = container.resolve('Report')
        const invoicesFactory: any = container.resolve('invoicesFactory')
        const earningsService: any = container.resolve('earningsService')

        logger.info('Getting user', { userId })
        const user = await User.findOne({ _id: userId }).exec()

        logger.info('Getting report informations', { year, month, user: userId })
        const report = await Report.findOne({ year, month, merchantCurrency: currency, user, status: 'completed' }).populate('providerReports').populate('earnings').exec()

        if (!report || userId !== user.id) {
            return { notFound: true }
        }

        const listOfReportsProvider = report.providerReports.filter((providerReport) => {
            return providerReport.providerType === providerType
        })

        if (listOfReportsProvider.length === ZERO) {
            return { notFound: true }
        }

        const providerSecured = providerType === 'appstore' ? 'appstore' : 'googleplay'
        const invoiceNumber = invoicesFactory.getInvoiceNumber(report, providerSecured)
        const supplierAddress = user.settings.address
        const partnerAddress = invoicesFactory.getProviderAddress(providerType, user.settings)

        const reportId: string = report._id.toString()
        const perProvider = await earningsService.getPerProvider(container, reportId, user, report)
        const invoiceableReportProvider = invoicesFactory.getInvoiceableReportProvider({
            year,
            month,
            providerType: providerSecured,
            perProvider,
            invoiceNumber,
            supplierAddress,
            partnerAddress
        })
        const invoice = await invoiceableReportProvider.generateInvoice()

        const fileName = `${year}-${month}-${currency}-${providerType}-${userId}.xlsx`

        return {
            invoice,
            fileName,
            notFound: false
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

export default {
    getAllInvoices,
    downloadInvoice
}