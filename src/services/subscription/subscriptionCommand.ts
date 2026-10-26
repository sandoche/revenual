import mongoose from 'mongoose'
import { UserDocument } from '../../models/User'
import { SubscriptionDocument } from '../../models/Subscription'
import { AwilixContainer } from 'awilix'

const createStripeSession = async (container: AwilixContainer, type: string, currency: string, isStripeProduction: boolean, userId: string, email: string, HOST: string) => {
    const errorTypes: any = container.resolve('errorTypes')
    const AppError: any = container.resolve('AppError')
    const appErrorTypes: any = container.resolve('appErrorTypes')
    const createError: any = container.resolve('createError')
    const logger: any = container.resolve('logger')

    try {
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0
        const subscription: SubscriptionDocument = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null

        logger.info('Loading new subscription page', { type, currency, isStripeProduction })
        const stripe: any = container.resolve('stripe')

        const subscriptionFactory: any = container.resolve('subscriptionFactory')
        const plan = subscriptionFactory.getPlan(type, currency, isStripeProduction)

        logger.info('Plan retrieved', { plan })
        if (plan.id) {
            logger.info('Creating Stripe session', { plan })

            const planName = `${type}_${currency}`
            const isSubscriptionNewOrRenewedAfterCancelation = subscription === null || (subscription && subscription.customerId && subscription.isCanceled)
            const isNewPlanTheSameAsThePreviousAndNotCanceled = subscription && !subscription.isCanceled && subscription.type === planName
            const doesPlanNeedToBeUpgradedOrDowngraded = subscription && !subscription.isCanceled && subscription.type !== planName

            let sessionId = null

            if (isSubscriptionNewOrRenewedAfterCancelation) {
                let userData = {}

                /* eslint-disable */
                if (subscription && subscription.customerId) {
                    userData = { 
                        customer: subscription.customerId
                    }
                } else {
                    userData = {
                        customer_email: email
                    }
                }
    
                const stripeOptions = {
                    ...userData,
                    ...{
                        payment_method_types: ['card'],
                        subscription_data: {
                            trial_period_days: 90,
                            items: [{
                                plan: plan.id,
                            }]
                        },
                        success_url: HOST + '/subscription/success?session_id={CHECKOUT_SESSION_ID}',
                        cancel_url: HOST + '/subscription/payment-canceled'
                    }}
                /* eslint-enable */
    
                const session: any = await stripe.checkout.sessions.create(stripeOptions)
                sessionId = session.id
            } else if (doesPlanNeedToBeUpgradedOrDowngraded) {
                logger.info('Upgrading/Downgrading Stripe subscription', { plan: plan.id })
                const stripeSubscription = await stripe.subscriptions.retrieve(subscription.subscriptionId)
                /* eslint-disable */
                await stripe.subscriptions.update(subscription.subscriptionId, {
                    cancel_at_period_end: false,
                    items: [{
                        id: stripeSubscription.items.data[0].id,
                        plan: plan.id,
                    }]
                })
                /* eslint-enable */
                subscription.type = planName
                await subscription.save()
            }

            logger.info('Result of the stripe session creation', { sessionId, isNewPlanTheSameAsThePreviousAndNotCanceled, doesPlanNeedToBeUpgradedOrDowngraded})

            return {
                sessionId,
                isNewPlanTheSameAsThePreviousAndNotCanceled,
                doesPlanNeedToBeUpgradedOrDowngraded
            }
        } else {
            throw new AppError(errorTypes.Error, appErrorTypes.GenericError, 'An error occured with Stripe', true, true)
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const createNewSubscription = async (container: AwilixContainer, session: any) => {
    const logger: any = container.resolve('logger')
    const createError: any = container.resolve('createError')
    const errorTypes: any = container.resolve('errorTypes')
    const AppError: any = container.resolve('AppError')
    const appErrorTypes: any = container.resolve('appErrorTypes')

    try {
        const stripe: any = container.resolve('stripe')

        const customerId = session.customer
        const subscriptionId = session.subscription
        const type = session.display_items[0].plan.nickname // eslint-disable-line
        const productId =session.display_items[0].plan.product // eslint-disable-line 
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const MILLISECONDS = 1000
        const startDate = new Date(subscription.created * MILLISECONDS)
        const endDate = new Date(subscription.current_period_end * MILLISECONDS)
        const customer = await stripe.customers.retrieve(customerId)
        const userEmail = customer.email

        logger.info('Getting user from email found in Stripe session', { userEmail })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ email: userEmail })

        if (user) {
            const Subscription: mongoose.Model<SubscriptionDocument> = container.resolve('Subscription')
            const userSubscription = new Subscription({
                startDate,
                endDate,
                type,
                subscriptionId,
                customerId,
                productId,
                isCanceled: false,
                isManual: false,
                user
            })

            logger.info('Creating a new subscription', { userEmail })
            await userSubscription.save()
            user.subscriptions.push(userSubscription)
            await user.save()

            return true
        } else {
            throw new AppError(errorTypes.Error, appErrorTypes.GenericError, 'User from stripe not found', true, true, { customerId, subscriptionId, userEmail })
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

const updateSubscriptionDate = async (container: AwilixContainer, userId: string) => {
    const logger: any = container.resolve('logger')

    try {
        logger.info('Getting the user and check its subscriptions', { userId })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0
        const userSubscription = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null

        if (userSubscription && !userSubscription.isManual) {
            logger.info('Subscription found', { userSubscriptionId: userSubscription.subscriptionId })
            const stripe: any = container.resolve('stripe')
            const subscription = await stripe.subscriptions.retrieve(userSubscription.subscriptionId)
            const MILLISECONDS = 1000
            const endDate = new Date(subscription.current_period_end * MILLISECONDS)
            const type = subscription.plan.nickname

            logger.info('Updating end date of subscription', { userSubscriptionId: userSubscription.subscriptionId, endDate, type })
            userSubscription.endDate = endDate
            userSubscription.type = type
            await userSubscription.save()
        } else if (userSubscription && userSubscription.isManual) {
            logger.info('User subscription is manual, not updating the date of end')
        }
    } catch (err) {
        logger.info('No subscription found or invalid')
    }
}

const cancelSubscription = async (container: AwilixContainer, userId: string) => {
    const logger: any = container.resolve('logger')

    try {
        logger.info('Getting the user and check its subscriptions', { userId })
        const User: mongoose.Model<UserDocument> = container.resolve('User')
        const user = await User.findOne({ _id: userId }).populate('subscriptions').exec()
        const ZERO = 0
        const subscription = user.subscriptions && user.subscriptions.length > ZERO ? user.subscriptions.reduceRight(a => a) : null
        let success = false
        let endDate = null

        if (subscription && !subscription.isManual) {
            logger.info('Subscription found, canceling subscription', { userSubscriptionId: subscription.subscriptionId })
            const stripe: any = container.resolve('stripe')
            
            stripe.subscriptions.update(subscription.subscriptionId, {cancel_at_period_end: true}) // eslint-disable-line
            endDate = subscription.endDate
            subscription.isCanceled = true
            await subscription.save()
            success = true
        } else if (subscription && subscription.isManual) {
            logger.info('User subscription is manual, cancelling it')
            subscription.isCanceled = true
            await subscription.save()
        }

        return {
            success,
            endDate
        }

    } catch (err) {
        return {
            success: false
        }
    }
}

const updateUserSubscriptionInformation = async (container: AwilixContainer, user: UserDocument, productsSold: number, month: number, year: number) => {
    const logger: any = container.resolve('logger')
    const createError: any = container.resolve('createError')

    try {
        logger.info('Compare productsSold with users max')
        const ZERO = 0
        const userMaxProductsSold = user.userSubscriptionsInformation.maxProductsSold ? user.userSubscriptionsInformation.maxProductsSold : ZERO
        const needToUpdateProductsSold = userMaxProductsSold < productsSold
        const MONTH_OFFSET = 1

        if (needToUpdateProductsSold) {
            logger.info('Update the number of product sold', { user: user.id, year, month })
            const dateOfReport = new Date()
            dateOfReport.setFullYear(year)
            // @ts-ignore
            dateOfReport.setMonth(parseInt(month) - MONTH_OFFSET)

            user.userSubscriptionsInformation.maxProductsSold = productsSold
            user.userSubscriptionsInformation.maxProductsSoldDate = dateOfReport

            await user.save()
        }
    } catch (err) {
        const error = createError(err)
        throw error
    }
}

export default {
    createStripeSession,
    createNewSubscription,
    updateSubscriptionDate,
    cancelSubscription,
    updateUserSubscriptionInformation
}