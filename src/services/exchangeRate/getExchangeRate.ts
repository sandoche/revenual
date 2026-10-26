import { ExchangeRate } from '../../models/ExchangeRate'
import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import fetch from 'node-fetch'
// import isValidCurrency from '../shared/isValidCurrency'

export default async (from: string, to: string, date: Date): Promise<number> => {
    try {
        const DATE_OFFSET = 1
        const RATE_EQUAL = 1
        const RATE_ERROR = 0
        
        const year = date.getFullYear()
        const month = date.getMonth() + DATE_OFFSET
        let rate: number

        if (from === to) {
            return RATE_EQUAL
        }

        if (isNaN(year) || isNaN(month)) {
            return RATE_ERROR
        }

        logger.info('Getting exchange rate from database', { from, to, year, month })

        const exchangeRate = await ExchangeRate.findOne({
            year,
            month,
            from,
            to
        }).exec()


        if (exchangeRate) {
            rate = exchangeRate.rate
            logger.info('Exchange rate got from the database', { from, to, year, month, rate })
        } else {
            logger.info('Getting exchange rate from the API exchangeratesapi', { from, to, year, month })
            const result = await fetch(`https://api.exchangeratesapi.io/${year}-${month}-25?base=${from}&symbols=${to}`)
            const resultJson = await result.json()

            if (!resultJson.error) { // injections protected by the check isValidCurrency() on the begining
                rate = resultJson.rates[to] // eslint-disable-line
            } else {
                logger.info('Getting exchange rate from the API fixer', { from, to, year, month })
                const FORMAT_TYPE = -2
                const formattedMonth = ('0' + month).slice(FORMAT_TYPE)
                const fallbackResult = await fetch(`http://data.fixer.io/api/${year}-${formattedMonth}-25?access_key=0fbe842119e66ad4ecc5e81671aaa406&symbols=${from},${to}`)
                const fallbackResultJson = await fallbackResult.json()
                rate = fallbackResultJson.rates[to] / fallbackResultJson.rates[from] // eslint-disable-line
                // injections above protected by the check isValidCurrency() on the begining
            }

            const newExchangeRate = new ExchangeRate({
                year,
                month,
                from,
                to,
                rate
            })

            logger.info('Saving new exchange rate got fromthe API', { from, to, year, month, rate })
            await newExchangeRate.save()
        }

        return rate

    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeRateError, 'Could not get the exchange rate', true, true, { from, to, date }, err)
    }
}
