import { Earning, EarningDocument } from '../../../models/Earning'
import { AccountDocument } from '../../../models/Account'
import { ReportDocument } from '../../../models/Report'
import logger from '../../../util/logger'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'
import timeout from '../../shared/timeout'
import csvToArray from '../../shared/csvToArray'
import exchangeRateService from '../../exchangeRate'

export const parseReportGoogleplay = async (data: string, currencyMerchant: string, account: AccountDocument, accountId: string, report: ReportDocument, year: number, month: number): Promise<EarningDocument[]> => {
    try {
        logger.info('Starting Google play parsing', { accountId })
        let earnings: EarningDocument[] = []

        if (data === null) {
            logger.info('Not data found, returning empty earnings', { accountId })
            return earnings
        }

        const lines: any[][] = csvToArray(data, ',')
        const earningsMap: any = {}

        // injections protected because constants
        /* eslint-disable */

        for (let lineData of lines) {
            let earning: EarningDocument

            const transactionId = lineData[0]
            const transactionDateString = lineData[1]
            const transactionTimeString = lineData[2]
            const transactionDate = new Date(transactionDateString + ' ' + transactionTimeString)
            const transactionType = lineData[4]
            const productTitle = lineData[6]
            const productId = lineData[9]
            const countryCode = lineData[11]
            const buyerCurrency = lineData[14]
            const unitSalePriceBuyerCurrency = parseFloat(lineData[15])
            let merchantCurrency = lineData[17]
            let exchangeRate = parseFloat(lineData[16])
            let unitSalePriceMerchantCurrency = parseFloat(lineData[18])
            const isRefund = (transactionType === 'Google fee refund' || transactionType === 'Charge refund')
            const isRefundCode = isRefund ? 'R' : 'S'
            const isTax = (transactionType === 'Tax')

            /* eslint-enable */

            if (merchantCurrency != currencyMerchant) {
                merchantCurrency = currencyMerchant
                exchangeRate = await exchangeRateService.getExchangeRate(buyerCurrency, currencyMerchant, transactionDate)
                unitSalePriceMerchantCurrency = unitSalePriceBuyerCurrency * exchangeRate
            }

            logger.info('Parsing Google play transaction', { transactionId, transactionType, isRefund })

            if (earningsMap[transactionId + isRefundCode]) {
                earning = earningsMap[transactionId + isRefundCode]

                // Adds fee to existing transaction
                if (transactionType === 'Google fee' || transactionType === 'Google fee refund') {
                    logger.info('Adding a fee for a transaction', { transactionId })

                    earning.unitFeePriceBuyerCurrency = unitSalePriceBuyerCurrency
                    earning.totalEarningBuyerCurrency = earning.unitSalePriceBuyerCurrency + earning.unitFeePriceBuyerCurrency + earning.unitTaxBuyerCurrency
                    
                    if (merchantCurrency == currencyMerchant) {
                        earning.unitFeeMerchantCurrency = unitSalePriceMerchantCurrency
                        earning.totalEarningMerchantCurrency = earning.unitSalePriceMerchantCurrency + earning.unitFeeMerchantCurrency + earning.unitTaxMerchantCurrency
                    } else {
                        earning.unitFeeMerchantCurrency = earning.unitFeePriceBuyerCurrency * exchangeRate
                        earning.totalEarningMerchantCurrency = earning.totalEarningBuyerCurrency * exchangeRate
                    }

                // Adds tax to existing transaction
                } else if (isTax) {
                    earning.unitTaxBuyerCurrency = earning.unitTaxBuyerCurrency + unitSalePriceBuyerCurrency
                    earning.totalEarningBuyerCurrency = earning.unitSalePriceBuyerCurrency + earning.unitFeePriceBuyerCurrency + earning.unitTaxBuyerCurrency
                
                    if (merchantCurrency == currencyMerchant) {
                        earning.unitTaxMerchantCurrency = earning.unitTaxMerchantCurrency + unitSalePriceMerchantCurrency
                        earning.totalEarningMerchantCurrency = earning.unitSalePriceMerchantCurrency + earning.unitFeeMerchantCurrency + earning.unitTaxMerchantCurrency
                    } else {
                        earning.unitTaxMerchantCurrency = earning.unitTaxBuyerCurrency * exchangeRate
                        earning.totalEarningMerchantCurrency = earning.totalEarningBuyerCurrency * exchangeRate
                    }
                }
            } else if (transactionType === 'Charge' || transactionType === 'Charge refund') {
                logger.info('Creating a new google play transaction', { transactionId })
                const UNIT_REFUND = -1
                const UNIT = 1

                earning = new Earning({
                    account,
                    report,
                    accountId,
                    providerType: 'googleplay',
                    createdAt: new Date(),
                    year,
                    month,
                    transactionDate,
                    productTitle,
                    productId,
                    units: isRefund ? UNIT_REFUND : UNIT,
                    countryCode,
                    buyerCurrency,
                    exchangeRate,
                    merchantCurrency,
                    unitSalePriceBuyerCurrency,
                    unitFeePriceBuyerCurrency: 0,
                    unitTaxBuyerCurrency: 0,
                    totalEarningBuyerCurrency: unitSalePriceBuyerCurrency,
                    unitSalePriceMerchantCurrency,
                    unitFeeMerchantCurrency: 0,
                    unitTaxMerchantCurrency: 0,
                    totalEarningMerchantCurrency: unitSalePriceMerchantCurrency,
                    transactionId,
                    reportId: report._id,
                    isRefund,
                    user: report.user
                })

                earningsMap[transactionId + isRefundCode] = earning
            }

            if (earning) {
                earnings.push(earning)
            }

            const TIME_PAUSE = 0
            await timeout(TIME_PAUSE)
        }

        // The 4 lines below fixes a weird error of mongoose do not delete
        const earningArrayFix = new Earning()
        earnings.push(earningArrayFix)
        const earningArrayFix1 = new Earning()
        earnings.push(earningArrayFix1) 

        logger.info('Finishing Google play parsing', { accountId })
        return earnings

    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleParsingError, 'Could not parse Google play report', true, true, { accountId, year, month }, err)
    }
}
