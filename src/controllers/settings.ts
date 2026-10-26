import { Request, Response, NextFunction } from 'express'
import container from '../services/servicesContainer'
import logger from '../util/logger'

/**
 * GET /invoices
 * Get all invoice
 */
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id

        const accountsCommand: any = container.resolve('accountsCommand')
        const currencyCodes: any = container.resolve('currencyCodes')
        const subscriptionChecker: any = container.resolve('subscriptionChecker')
        const subscriptionCommand: any = container.resolve('subscriptionCommand')
        
        await subscriptionCommand.updateSubscriptionDate(container, userId)

        const subscription = await subscriptionChecker.getUserSubscription(container, userId)
        const plans = subscriptionChecker.getAllPlansForUser(req.user)

        const {
            providerList,
            validatedAccounts
        } = await accountsCommand.getAccounts(container, userId)

        res.render('settings.twig', {
            title: 'Settings',
            providers: providerList,
            accounts: validatedAccounts,
            currencyCodes,
            subscription,
            plans,
            error: req.query['error'],
            path: req.path
        })
    }
    catch (err) {
        logger.error('Error in getAccounts', { user: req.user.id })
        next(err)
    }    
}
