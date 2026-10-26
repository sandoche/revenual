import mongoose from 'mongoose'
import { UserDocument } from '../../models/User'
import { SubscriptionDocument } from '../../models/Subscription'
import { AwilixContainer } from 'awilix'
import { maxProductsFreemium, maxMinProductsPerSubscriptionType } from '../../config/subscriptions'
import subscriptionRecommendation from './utils/subscriptionRecommendation'

const isUserSubscriptionEnough = async (container: AwilixContainer, userId: string, accountsNumber: number) => {
    const logger: any = container.resolve('logger')
    try {
        logger.info('Loading user subscription info', { userId })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0

        const userProductsSold = user.userSubscriptionsInformation.maxProductsSold ? user.userSubscriptionsInformation.maxProductsSold : ZERO
        const isUserUsingFreemium = userProductsSold <= maxProductsFreemium

        if (isUserUsingFreemium) {
            logger.info('User is freemium', { userProductsSold, maxProductsFreemium })
            return true
        }

        const subscription: SubscriptionDocument = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null
        const subscriptionInfo = maxMinProductsPerSubscriptionType.get(subscription.type)
        const numberOfProductsSoldsMax = subscriptionInfo.max
        const numberOfProductsSoldsMin = subscriptionInfo.min
        const NOW = new Date()
        const isPlanAdapted = numberOfProductsSoldsMax >= userProductsSold
        const isSubscriptionNotExpired = subscription.endDate >= NOW
        const isSubscriptionValid = isPlanAdapted && isSubscriptionNotExpired
        logger.info('Checking if subscription is valid', { isSubscriptionValid, accountsNumber, numberOfProductsSoldsMax, numberOfProductsSoldsMin, endDate: subscription.endDate, dateNow: NOW, subscriptionType: subscription.type })

        return isSubscriptionValid
    } catch (error) {
        return false
    }
}

const getUserPlanRecommendation = async (container: AwilixContainer, userId: string) => {
    try {
        const logger: any = container.resolve('logger')

        logger.info('Loading user subscription in order to find the best plans', { userId })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0
        const subscription: SubscriptionDocument = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null

        if (subscription) {
            const NOW = new Date()
            const isSubscriptionExpired = subscription.endDate < NOW
            const currentType = subscription.type
            const recommendations = subscriptionRecommendation(currentType, user.settings.currency, isSubscriptionExpired, user.userSubscriptionsInformation.maxProductsSold, user.userSubscriptionsInformation.maxProductsSoldDate)

            logger.info('Returning users plan data', { type: subscription.type, isSubscriptionExpired, recommendations })
            return {
                recommendations
            }
        } else {
            const recommendations = subscriptionRecommendation(null, user.settings.currency, null, user.userSubscriptionsInformation.maxProductsSold, user.userSubscriptionsInformation.maxProductsSoldDate)
            logger.info('Returning users plan data', { recommendations })
            return {
                recommendations
            }
        }
    } catch (error) {
        return null
    }
}

const getUserSubscription = async (container: AwilixContainer, userId: string) => {
    try {
        const logger: any = container.resolve('logger')

        logger.info('Loading user subscription info', { userId })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0
        const subscription: SubscriptionDocument = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null

        logger.info('Returning subscription', { userId, subscription: subscription && subscription.subscriptionId, plan: subscription && subscription.type })

        return subscription
    } catch (error) {
        return null
    }
}

const getAllPlansForUser = (user: UserDocument) => {
    return subscriptionRecommendation(null, user.settings.currency, null, user.userSubscriptionsInformation.maxProductsSold, user.userSubscriptionsInformation.maxProductsSoldDate).recommendedPlans
}

export default {
    isUserSubscriptionEnough,
    getUserPlanRecommendation,
    getUserSubscription,
    getAllPlansForUser
}