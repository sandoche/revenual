import { Request, Response, NextFunction } from 'express'
import logger from '../util/logger'
import { NOT_FOUND_CODE } from '../constants/errorCodes'
import container from '../services/servicesContainer'

/**
 * GET /invoices
 * Get all invoice
 */
export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoicesCommand: any = container.resolve('invoicesCommand')
        const userId = req.user.id
        const subscriptionCommand: any = container.resolve('subscriptionCommand')
        subscriptionCommand.updateSubscriptionDate(container, userId)

        const { invoices } = await invoicesCommand.getAllInvoices(container, userId)

        res.render('invoices.twig', {
            title: 'Invoices',
            path: req.path,
            invoices
        })
    }
    catch (err) {
        logger.error('Error in getting all the invoices', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /invoices/:year-:month-:currency-:provider-:userId.xlsx
 * Download invoice
 */
export const downloadInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currency = req.params.currency
        const year = req.params.year
        const month = req.params.month
        const userId = req.params.userId
        const providerType = req.params.provider

        const invoicesCommand: any = container.resolve('invoicesCommand')
        const subscriptionChecker: any = container.resolve('subscriptionChecker')
        const subscriptionCommand: any = container.resolve('subscriptionCommand')

        await subscriptionCommand.updateSubscriptionDate(container, userId)

        const numberOfAccounts = req.user.accounts.length
        const isUserAuthorized = await subscriptionChecker.isUserSubscriptionEnough(container, userId, numberOfAccounts)

        if (!isUserAuthorized) {
            req.flash('errors', { msg: 'A subscription (or an upgrade) is required to download an invoice: <a href="/subscription">subscribe now</a>' })
            return res.redirect('/invoices')
        }

        const { 
            fileName,
            invoice,
            notFound
        } = await invoicesCommand.downloadInvoice(container, userId, year, month, currency, providerType)
        
        if (notFound) {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Invoice Not Found'
            })
            return
        }

        res.attachment(fileName)
        res.send(invoice)
    }
    catch (err) {
        logger.error('Error in downloadInvoice', { user: req.user.id })
        next(err)
    }
}