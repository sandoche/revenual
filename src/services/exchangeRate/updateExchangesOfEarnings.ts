import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import { EarningDocument } from '../../models/Earning'
import { ExchangeRate } from '../../models/ExchangeRate'
import timeout from '../shared/timeout'
import { ProviderExchangeRate } from './ProviderExchangeRate/ProviderExchangeRate'

export default async (earnings: EarningDocument[], exchanges: ProviderExchangeRate[]): Promise<void> => {
    try {
        logger.info('Going through all the earnings to update the exchange rate if needed')
        
        for (const earning of earnings) {
            const exchangeRate = getRightExchangeRate(earning, exchanges)
            if (exchangeRate) {
                await updateEarningExchangeRates(earning, exchangeRate)
                await updateExchangeRatesIfCorrect(exchangeRate, earning.year, earning.month)
            }
        }
    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeUpdateError, 'Could not get exchanges from post', true, true, {}, err)
    }
}

const getRightExchangeRate = (earning: EarningDocument, exchanges: ProviderExchangeRate[]): any => {
    try {
        logger.info('Trying to get exchange rate sent eventually by the user')
        const exchange = exchanges.filter((item) => {
            return item.id === `${earning.buyerCurrency}-${earning.merchantCurrency}-${earning.providerType}`
        })
        
        const FIRST_ITEM = 0 // Injection avoided because constants
        return exchange[FIRST_ITEM] ? exchange[FIRST_ITEM] : null // eslint-disable-line
    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeUpdateError, 'Could not get the right exchange for the earning', true, true, {}, err)
    }
}

const updateEarningExchangeRates = async (earning: EarningDocument, exchange: ProviderExchangeRate): Promise<void> => {
    try {
        logger.info('Updating earning exchange rate', earning._id.toString())
        const newRate = exchange.rate
        earning.exchangeRate = newRate
        earning.unitSalePriceMerchantCurrency = earning.unitSalePriceBuyerCurrency * newRate
        earning.unitFeeMerchantCurrency = earning.unitFeePriceBuyerCurrency * newRate
        earning.unitTaxMerchantCurrency = earning.unitTaxBuyerCurrency * newRate
        earning.totalEarningMerchantCurrency = earning.totalEarningBuyerCurrency * newRate
        earning.exhangeRateUpdateDate = new Date()

        logger.info('Saving earning with new exchange rate', earning._id.toString())
        await earning.save()
        const WAITING_TIME = 0
        await timeout(WAITING_TIME)
    } catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ExchangeUpdateError, 'Could not update the exchange rate of the earning in the database', true, true, {}, err)
    }
}

const updateExchangeRatesIfCorrect = async (exchange: ProviderExchangeRate, year: number, month: number): Promise<void> => {
    try {
        const ACCEPTED_EXCHANGE_RATIO_TRESHOLD = 0.05

        logger.info('Getting an exchange rate from the database', exchange, year, month)
        const exchangeFromDb = await ExchangeRate.findOne({
            year,
            month,
            from: exchange.from,
            to: exchange.to
        }).exec()
        await timeout(100) // eslint-disable-line

        if (exchangeFromDb) {
            const changeRatio = Math.abs(exchangeFromDb.rate - exchange.rate)/exchangeFromDb.rate
            if (changeRatio < ACCEPTED_EXCHANGE_RATIO_TRESHOLD) {
                logger.info('Updating exchange in database', exchange, changeRatio, ACCEPTED_EXCHANGE_RATIO_TRESHOLD)
                exchangeFromDb.rate = exchange.rate
                await exchangeFromDb.save()
                await timeout(100) // eslint-disable-line
            }
        }

    } catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ExchangeUpdateError, 'Could not save the exchange rate to the database', true, true, { exchange }, err)
    }
}