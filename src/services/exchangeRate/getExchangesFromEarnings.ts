import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import { EarningDocument } from '../../models/Earning'
import { ProviderExchangeRate } from './ProviderExchangeRate/ProviderExchangeRate'

export default (earnings: EarningDocument[]): ProviderExchangeRate[] => {
    try {
        logger.info('Getting unique exchanges rates from earnings')
        let exchanges: ProviderExchangeRate[] = []
        let exchangeMap: any = {}

        for (const earning of earnings) {
            const { buyerCurrency, merchantCurrency, exchangeRate, providerType } = earning
            if (!exchangeMap[`${buyerCurrency}-${merchantCurrency}-${providerType}`] && buyerCurrency !== merchantCurrency) {
                const exchange: ProviderExchangeRate = {
                    from: buyerCurrency,
                    to: merchantCurrency,
                    rate: exchangeRate,
                    type: providerType,
                    id: `${buyerCurrency}-${merchantCurrency}-${providerType}`
                }

                exchangeMap[`${buyerCurrency}-${merchantCurrency}-${providerType}`] = true
                exchanges.push(exchange)
            }
        }

        return exchanges
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.ExchangeUpdateError, 'Could not get the list of exchanges from earnings', true, true, {}, err)
    }
}
