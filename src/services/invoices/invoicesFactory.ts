import { ReportDocument } from '../../models/Report'
import { ProviderReportDocument } from '../../models/ProviderReport'
import { InvoiceableReportProvider } from './invoiceableReport/InvoiceableReportProvider'
import { InvoiceableReportAppstore } from './invoiceableReport/InvoiceableReportAppstore'
import { InvoiceableReportGoogleplay } from './invoiceableReport/InvoiceableReportGoogleplay'
import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'

const getInvoiceableReportProvider = (params: any): InvoiceableReportProvider => {
    try {
        let invoiceableReport: InvoiceableReportProvider
        const {
            providerType,
            perProvider,
            invoiceNumber,
            invoiceDate,
            paymentDate,
            supplierAddress,
            partnerAddress,
            year,
            month
        } = params

        // injection avoided because it's a constant
        const providerEarnings = perProvider.filter((earningsProvider: any) => {
            return earningsProvider._id.providerType === providerType
        })[0] // eslint-disable-line

        const data = {
            providerEarnings,
            invoiceNumber,
            invoiceDate,
            paymentDate,
            supplierAddress,
            partnerAddress,
            year: parseInt(year),
            month: parseInt(month)
        }

        if (providerType === 'appstore') {
            invoiceableReport = new InvoiceableReportAppstore(data)
        }
        else if (providerType === 'googleplay') {
            invoiceableReport = new InvoiceableReportGoogleplay(data)
        }

        return invoiceableReport
    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.InvoiceGenerationError, 'Could not get InvoiceableReportProvider', true, true, {}, err)
    }
}

const getInvoiceNumber = (report: ReportDocument, providerType: string): number => {
    try {
        // injection avoided because it's a constant
        const providerReport: ProviderReportDocument = report.providerReports.filter((providerReport) => {
            return providerReport.providerType === providerType
        })[0] // eslint-disable-line

        return providerReport.id
    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.InvoiceGenerationError, 'Could not get Invoice number', true, true, {}, err)
    }
}

const getProviderAddress = (providerType: string, userSettings: any): any => {
    if (providerType === 'appstore') {
        return userSettings.appstore.address
    } else {
        return userSettings.googleplay.address
    }
}

export default {
    getInvoiceableReportProvider,
    getInvoiceNumber,
    getProviderAddress
}