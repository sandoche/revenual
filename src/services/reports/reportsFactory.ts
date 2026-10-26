import { AccountDocument } from '../../models/Account'
import { ReportableAccount } from './reportableAccounts/ReportableAccount' 
import { ReportableAppstore } from './reportableAccounts/ReportableAppstore' 
import { ReportableGoogleplay } from './reportableAccounts/ReportableGoogleplay' 
import { ProviderReportDocument } from '../../models/ProviderReport'
import { ParsableProviderReport } from './providerReport/ParsableProviderReport'
import { ParsableProviderReportAppstore } from './providerReport/ParsableProviderReportAppstore'
import { ParsableProviderReportGoogleplay } from './providerReport/ParsableProviderReportGoogleplay'
import { AwilixContainer } from 'awilix'

const getReportableAccounts = (accounts: AccountDocument[], month: number, year: number): ReportableAccount[] => {
    const reportableAccounts: ReportableAccount[] = []

    for (const account of accounts) {
        let reportableAccount: ReportableAccount
      
        if (account.type === 'appstore') {
            reportableAccount = new ReportableAppstore(account, month, year)
        }
        else if (account.type === 'googleplay') {
            reportableAccount = new ReportableGoogleplay(account, month, year)
        }

        reportableAccounts.push(reportableAccount)
    }

    return reportableAccounts
}

const getParsableProviderReport = (container: AwilixContainer, providerReport: ProviderReportDocument, currency: string): ParsableProviderReport => {
    let parsableProviderReport: ParsableProviderReport

    if (providerReport.providerType === 'appstore') {
        parsableProviderReport = new ParsableProviderReportAppstore(container, providerReport, currency)
    }
    else if (providerReport.providerType === 'googleplay') {
        parsableProviderReport = new ParsableProviderReportGoogleplay(container, providerReport, currency)
    }

    return parsableProviderReport
}

export default {
    getReportableAccounts,
    getParsableProviderReport
}