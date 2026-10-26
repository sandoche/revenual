import { devStripeIdPerSubscriptionType, prodStripeIdPerSubscriptionType, plans, supportedCurrencies, defaultCurrency } from '../../config/subscriptions'

const getPlan = (type: string, currency: string, isStripeProduction: string) => {

    let currencySafe = defaultCurrency

    if (supportedCurrencies.includes(currency)) {
        currencySafe = currency
    }

    const key = `${type}_${currencySafe}`
    
    if (plans.includes(key)) {
        if (isStripeProduction) {
            return {
                id: prodStripeIdPerSubscriptionType.get(key)
            }
        } else {
            return {
                id: devStripeIdPerSubscriptionType.get(key)
            }
        }
    } else {
        return {
            error: true
        }
    }
}

export default {
    getPlan
}