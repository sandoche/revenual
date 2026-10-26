import { Earning, EarningDocument } from '../../../models/Earning'
import { AccountDocument } from '../../../models/Account'
import { ReportDocument } from '../../../models/Report'
import logger from '../../../util/logger'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'
import csvToArray from '../../shared/csvToArray'
import timeout from '../../shared/timeout'
import { AwilixContainer } from 'awilix'

export const parseReportAppstore = async (container: AwilixContainer, data: string, currencyMerchant: string, account: AccountDocument, accountId: string, report: ReportDocument, year: number, month: number): Promise<EarningDocument[]> => {
    try {
        logger.info('Starting Appstore parsing', { accountId })
        let earnings: EarningDocument[] = []

        if (data === null) {
            logger.info('Not data found, returning empty earnings', { accountId })
            return earnings
        }

        const lines: any[][] = csvToArray(data, '\t')
        let i = 0
        const exchangeRateService: any = container.resolve('exchangeRateService')

        for (let lineData of lines) {
            let earning: EarningDocument

            // injections protected because constants
            /* eslint-disable */
            const transactionDate = new Date(lineData[0])
            const productTitle = lineData[12]
            const productId = lineData[4]
            const countryCode = lineData[17]
            const buyerCurrency = lineData[21]
            const merchantCurrency = currencyMerchant
            const unitSalePriceBuyerCurrency = parseFloat(lineData[20])
            const units = parseInt(lineData[5])
            const salesOrReturn = lineData[9]
            const salesOrReturnMultiplier = salesOrReturn === 'S' ? 1 : -1
            const unitFeePriceBuyerCurrency = salesOrReturnMultiplier * parseFloat(lineData[6]) - unitSalePriceBuyerCurrency
            const totalEarningBuyerCurrency = parseFloat(lineData[7])
            const transactionId = `${productId}-${buyerCurrency}-${lineData[10]}-${Math.abs(units)}`
            const exchangeDate = new Date()
            exchangeDate.setFullYear(year)
            exchangeDate.setMonth(month - 1)
            /* eslint-enable */

            if (salesOrReturn === 'S' || salesOrReturn === 'R') {

                const exchangeRate = await exchangeRateService.getExchangeRate(buyerCurrency, currencyMerchant, exchangeDate)
                const unitSalePriceMerchantCurrency = unitSalePriceBuyerCurrency * exchangeRate
                const unitFeeMerchantCurrency = unitFeePriceBuyerCurrency * exchangeRate
                const totalEarningMerchantCurrency = totalEarningBuyerCurrency * exchangeRate
                const isRefund = salesOrReturn === 'R'

                logger.info('Creating a new earning document', { line: i, isRefund })
                earning = new Earning({
                    account,
                    report,
                    accountId,
                    providerType: 'appstore',
                    createdAt: new Date(),
                    year,
                    month,
                    transactionDate,
                    productTitle,
                    productId,
                    units,
                    countryCode,
                    buyerCurrency,
                    exchangeRate,
                    merchantCurrency,
                    unitSalePriceBuyerCurrency,
                    unitFeePriceBuyerCurrency,
                    unitTaxBuyerCurrency: 0,
                    totalEarningBuyerCurrency,
                    unitSalePriceMerchantCurrency,
                    unitFeeMerchantCurrency,
                    unitTaxMerchantCurrency: 0,
                    totalEarningMerchantCurrency,
                    transactionId,
                    reportId: report._id,
                    isRefund,
                    user: report.user
                })

                logger.info('Adding earning', { line: i, transactionId })
                earnings.push(earning)
            }

            i++
            const TIME_PAUSE = 0
            await timeout(TIME_PAUSE)
        }

        // The 4 livnes below fixes a weird error of mongoose do not delete
        const earningArrayFix = new Earning()
        earnings.push(earningArrayFix)
        const earningArrayFix1 = new Earning()
        earnings.push(earningArrayFix1) 

        logger.info('Finishing Appstore parsing', { accountId })
        return earnings

    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.AppleParsingError, 'Could not parse Appstore report', true, true, { accountId, year, month }, err)
    }
}