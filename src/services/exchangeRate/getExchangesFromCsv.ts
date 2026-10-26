import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import { ProviderExchangeRate } from './ProviderExchangeRate/ProviderExchangeRate'
import csvToArray from '../shared/csvToArray'

export default (exchangesToSet: ProviderExchangeRate[], csvData: string, providerType: string): ProviderExchangeRate[] => {
    try {
        logger.info('Starting Exchange CSV parsing')
        const lines: any[][] = csvToArray(csvData, ',')
        const validatedExchanges: any[] = []

        // Injections avoided because every index is a number
        const INDEX_LABELS = 2
        const lineWithLabels = lines[INDEX_LABELS] // eslint-disable-line

        /* eslint-disable */
        const isFullReport = lineWithLabels.length === 12

        logger.info('Getting the index', { isFullReport, columns: lineWithLabels.length })

        const INDEX_COUNTRY = 0
        const INDEX_PRICE_BUYER_CURRENCY = isFullReport ? 7 : 6
        const INDEX_PRICE_MERCHANT_CURRENCY = isFullReport ? 9 : 7
        const INDEX_MERCHANT_CURRENCY = isFullReport ? 10 : 8
        /* eslint-enable */
        
        for (const line of lines) {
            /* eslint-disable */
            const country = line[INDEX_COUNTRY]
            const priceInBuyerCurrency = parseFloat(line[INDEX_PRICE_BUYER_CURRENCY])
            const priceInMerchantCurrency = parseFloat(line[INDEX_PRICE_MERCHANT_CURRENCY])
            const merchantCurrency = line[INDEX_MERCHANT_CURRENCY]
            
            if (country != '' && merchantCurrency != '' && priceInBuyerCurrency && priceInMerchantCurrency) {
                const buyerCurrency = country.match(/(?<=\()[A-Z]{3}(?=\))/)
                const exchangeRate = priceInMerchantCurrency / priceInBuyerCurrency
                const id = `${buyerCurrency}-${merchantCurrency}-${providerType}`

                const isExchangeInTheList = exchangesToSet.filter(item => {
                    return item.id === id
                })

                if (isExchangeInTheList[0] && isExchangeInTheList[0].rate != exchangeRate) {
                    const exchangeValidated = Object.assign({}, isExchangeInTheList[0], { rate: exchangeRate })
                    validatedExchanges.push(exchangeValidated)
                }
            }
            /* eslint-enable */
        }

        return validatedExchanges

    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeCsvError, 'Could not get exchanges from csv', true, true, { providerType }, err)
    }
}

const findIndexLabel = (labelsLine: string[], labelName: string) => {
    return labelsLine.indexOf(labelName)
}