import { maxMinProductsPerSubscriptionType, plansDetails, supportedCurrencies, defaultCurrency, maxPlansDisplayed, maxProductsFreemium } from '../../../config/subscriptions'

const subscriptionRecommendation = (currentType: string, userCurrency: string, isSubscriptionExpired: boolean, maxProductsSold: number, maxProductsSoldDate: Date): any => {
    const DATE_OFFSET = 1
    const ZERO = 0

    let message: string

    const userProductsSold = maxProductsSold ? maxProductsSold : ZERO
    const recommendedPlansNoDetails = findPlansThatFitsCurrencyAndSales(userProductsSold, userCurrency)

    if (currentType === recommendedPlansNoDetails[0] && isSubscriptionExpired) { // eslint-disable-line
        message = 'Your subscription has ended, we invite to subscribe again to access this content.'
    } else if (currentType !== null && !isSubscriptionExpired) {
        message = `Your sales are growing, congratulations! We saw that you sold ${maxProductsSold} on your best selling month (${maxProductsSoldDate.getMonth() + DATE_OFFSET}/${maxProductsSoldDate.getFullYear()}) you need to upgrade your subscription.`
    } else if (maxProductsSoldDate && maxProductsSold) {
        message = `This page requires a subscription. Here is the ones that fits your best selling month ${maxProductsSoldDate.getMonth() + DATE_OFFSET}/${maxProductsSoldDate.getFullYear()} with ${maxProductsSold} units sold.`
    } else {
        message = 'This page requires a subscription'
    }

    const recommendedPlans = recommendedPlansNoDetails.map((item: any) => {
        return plansDetails.get(item)
    })

    return {
        message,
        recommendedPlans
    }
}

const findPlansThatFitsCurrencyAndSales = (sales: number, userCurrency: string): any => {
    const plans: any[] = []
    let safeCurrency = defaultCurrency
    let i = 1


    if (supportedCurrencies.includes(userCurrency.toLowerCase())) {
        safeCurrency = userCurrency.toLowerCase()
    }

    maxMinProductsPerSubscriptionType.forEach((plan) => {
        if (plan.currency.toLowerCase() === safeCurrency.toLowerCase() && plan.max > maxProductsFreemium && i <= maxPlansDisplayed) {
            plans.push(plan.name)
            i++
        }
    })

    return plans
}

export default subscriptionRecommendation