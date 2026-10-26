import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import AppleReporter from 'apple-reporter'
import logger from '../../../util/logger'
import appErrorTypes from '../../../constants/appErrorTypes'

export const downloadReportAppstore = async (id: string, token: string, month: number, year: number): Promise<string> => {
    try {
        const reporter = new AppleReporter({
            userid: id,
            accesstoken: token
        })

        logger.info('Getting AppStore vendors', { id })
        const vendors = await reporter.Sales.getVendors()
        
        // injection protected because constant
        const vendor = vendors.Vendors.Vendor[0] // eslint-disable-line
        
        const fiscalYear = getFiscalYear(month, year).toString() 
        const fiscalPeriod = getFiscalPeriod(month) 
        const reportOptions = {
            vendorNumber: vendor,
            regionCode: 'ZZ',
            reportType: 'Financial',
            fiscalYear,
            fiscalPeriod
        }
        logger.info('Getting AppStore report', { reportOptions })
        const report = await reporter.Finance.getReport(reportOptions)

        return report
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.AppleDownloadError, 'Could not download Appstore reports', true, true, { id, month, year }, err)
    }
}

// This function is based on this:
// https://itunesconnect.apple.com/WebObjects/iTunesConnect.woa/wa/jumpTo?page=fiscalcalendar
const getFiscalPeriod = (month: any): string => {
    /* eslint-disable */
    const monthNumber = parseInt(month)
    switch (monthNumber) {
        case 1:
            return '04'
            break
        case 2:
            return '05'
            break
        case 3:
            return '06'
            break
        case 4:
            return '07'
            break
        case 5:
            return '08'
            break
        case 6:
            return '09'
            break
        case 7:
            return '10'
            break
        case 8:
            return '11'
            break
        case 9:
            return '12'
            break
        case 10:
            return '01'
            break
        case 11:
            return '02'
            break
        case 12:
            return '03'
            break
        default:
            return null
            break
    }
    /* eslint-enable */
}


// This function is based on this:
// https://itunesconnect.apple.com/WebObjects/iTunesConnect.woa/wa/jumpTo?page=fiscalcalendar
const getFiscalYear = (month: any, year: any): number => {
    /* eslint-disable */
    const monthNumber = parseInt(month)
    const currentYear = parseInt(year)

    switch (monthNumber) {
        case 1:
            return currentYear
            break
        case 2:
            return currentYear
            break
        case 3:
            return currentYear
            break
        case 4:
            return currentYear
            break
        case 5:
            return currentYear
            break
        case 6:
            return currentYear
            break
        case 7:
            return currentYear
            break
        case 8:
            return currentYear
            break
        case 9:
            return currentYear
            break
        case 10:
            return currentYear + 1
            break
        case 11:
            return currentYear + 1
            break
        case 12:
            return currentYear + 1
            break
        default:
            return currentYear
            break
    }
    /* eslint-enable */
}