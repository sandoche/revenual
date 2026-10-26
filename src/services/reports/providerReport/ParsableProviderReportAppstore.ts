import { ParsableProviderReport } from './ParsableProviderReport'
import { AccountDocument } from '../../../models/Account'
import { ReportDocument } from '../../../models/Report'
import { ProviderReportDocument } from '../../../models/ProviderReport'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'
import { parseReportAppstore } from '../utils/parseReportAppstore'
import { AwilixContainer } from 'awilix'

export class ParsableProviderReportAppstore implements ParsableProviderReport {
    createdAt: Date
    year: number
    month: number
    providerType: string
    data: string
    accountId: string
    account: AccountDocument
    report: ReportDocument
    currency: string
    container: AwilixContainer

    constructor(container: AwilixContainer, providerReport: ProviderReportDocument, currency: string) {
        this.container = container
        this.createdAt = providerReport.createdAt
        this.year = providerReport.year
        this.month = providerReport.month
        this.data = providerReport.data
        this.accountId = providerReport.accountId
        this.account = providerReport.account
        this.report = providerReport.report
        this.currency = currency
        return this
    }

    async parse() {
        try {
            this.report.earnings = await parseReportAppstore(this.container, this.data, this.currency, this.account, this.accountId, this.report, this.year, this.month)
            return this
        }
        catch (err) {
            this.report.earnings = []
            return this
        }
    }

}