import { Request, Response, NextFunction } from 'express'
import container from '../services/servicesContainer'
import logger from '../util/logger'

/**
 * GET /subscription
 * Show plans to the user to subscribe.
 */
export const getPlans = async (req: Request, res: Response,  next: NextFunction) => {
    try {
        const subscriptionChecker: any = container.resolve('subscriptionChecker')
        const plans = subscriptionChecker.getAllPlansForUser(req.user)

        res.render('plans.twig', {
            title: 'Subscription',
            path: req.path,
            plans
        })
    }
    catch (err) {
        logger.error('Error in getNewSubscription', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /subscription/:type/:currency
 * New subscription page.
 */
export const getNewSubscription = async (req: Request, res: Response,  next: NextFunction) => {
    try {
        const HOST = process.env.HOST_APP
        const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY
        const currency = req.params.currency
        const type = req.params.type
        const isStripeProduction = process.env.STRIPE_ENV_PROD === 'TRUE'
        const userId = req.user.id
        const userEmail = req.user.email

        const subscriptionCommand: any = container.resolve('subscriptionCommand')

        const { sessionId, isNewPlanTheSameAsThePreviousAndNotCanceled, doesPlanNeedToBeUpgradedOrDowngraded } = await subscriptionCommand.createStripeSession(container, type, currency, isStripeProduction, userId, userEmail, HOST)

        if (sessionId) {
            res.render('subscription.twig', {
                title: 'Subscription',
                path: req.path,
                STRIPE_PUBLIC_KEY,
                CHECKOUT_SESSION_ID: sessionId
            })
        } else {
            if (isNewPlanTheSameAsThePreviousAndNotCanceled) {
                req.flash('errors', { msg: 'Sorry, you are already subscribed to this plan' })
            }
            else if (doesPlanNeedToBeUpgradedOrDowngraded) {
                req.flash('success', { msg: 'Congratulations, your plan has been changed successfully' })
            }
            return res.redirect('/settings')
        }
    }
    catch (err) {
        logger.error('Error in getNewSubscription', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /subscription/cancel
 * Cancel a subscription
 */
export const getCancelSubscription = async (req: Request, res: Response,  next: NextFunction) => {
    try {
        const userId = req.user.id
        const subscriptionCommand: any = container.resolve('subscriptionCommand')

        const { success, endDate } = await subscriptionCommand.cancelSubscription(container, userId)

        if (success) {
            req.flash('success', { msg: `Your subscription have been canceled successfully, it will be effective until ${endDate} you can re-subscribe at any time` })
        }
        else {
            req.flash('errors', { msg: 'Your subscription has already been canceled or could not be canceled, please contact the support' })
        }

        return res.redirect('/settings')
    }
    catch (err) {
        logger.error('Error in getCancelSubscription', { user: req.user.id })
        next(err)
    }
}


/**
 * GET /subscription/success
 * New subscription success page.
 */
export const getNewSubscriptionSuccess = (req: Request, res: Response) => {
    req.flash('success', { msg: 'Congratulations, you successfully subscribe to Revenual' })
    return res.redirect('/reports')
}

/**
 * GET /subscription/payment-canceled
 * New subscription success page.
 */
export const getNewSubscriptionCancel = (req: Request, res: Response) => {
    req.flash('errors', { msg: 'Payement canceled' })
    return res.redirect('/reports')
}

/**
 * POST /subscription/webhook
 * Webhook for stripe
 */
export const webhook = async (req: Request, res: Response) => {
    const stripe: any = container.resolve('stripe')
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY

    let event: any

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`) // eslint-disable-line
    }

    if (event.type === 'checkout.session.completed') {
        const subscriptionCommand: any = container.resolve('subscriptionCommand')
        const session = event.data.object
        await subscriptionCommand.createNewSubscription(container, session)
    }

    res.json({received: true})
}