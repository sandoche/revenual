import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import { ProviderExchangeRate } from './ProviderExchangeRate/ProviderExchangeRate'

export default (exchangesToSet: ProviderExchangeRate[], postParameters: any): ProviderExchangeRate[] => {
    try {
        logger.info('Getting exchange rate typed by users that are different from the originals')
        const exchangesFromPost: any[] = []

        for (const exchange of exchangesToSet) {
            if (postParameters[exchange.id] && postParameters[exchange.id] != exchange.rate) {
                const newExchange = Object.assign({}, exchange, { rate: postParameters[exchange.id] })
                exchangesFromPost.push(newExchange)
            }
        }

        return exchangesFromPost

    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeUpdateError, 'Could not get exchanges from post', true, true, {}, err)
    }
}