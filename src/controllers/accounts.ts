import { Request, Response, NextFunction } from 'express'
import { AuthenticableProvider } from '../services/accounts/providers/provider'
import i18n from 'i18n'
import { NOT_FOUND_CODE } from '../constants/errorCodes'
import logger from '../util/logger'
import container from '../services/servicesContainer'
import ErrorHandler from '../services/shared/ErrorHandler'
import { getGoogleAccountDisplay } from '../config/google'

/**
 * GET /welcome
 * Accounts page for onboarding
 */
export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id

        const accountsCommand: any = container.resolve('accountsCommand')

        const {
            providerList,
            validatedAccounts
        } = await accountsCommand.getAccounts(container, userId)

        res.render('welcome.twig', {
            title: 'Accounts',
            providers: providerList,
            accounts: validatedAccounts,
            error: req.query['error'],
            info: req.query['info'],
            path: req.path
        })
    }
    catch (err) {
        logger.error('Error in getAccounts', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /welcome/next
 * Finish onboarding
 */
export const finishOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const NONE = 0
        const user = req.user
        const numberOfAccounts = user.accounts.length

        // eslint-disable-next-line 
        if (numberOfAccounts === NONE && false) { // TEMPORARY: hack to skip the onboarding
            return res.redirect('/welcome?info=required')
        } else {
            user.isOnboardingFinished = true
            await user.save()
    
            return res.redirect('/reports')
        }

    }
    catch (err) {
        logger.error('Error in finishOnboarding', { user: req.user.id })
        next(err)
    }
}

/**
 * GET /accounts/add/:provider
 * Accounts page.
 */
export const getAddAccount = (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('Getting add account page', { provider: req.params.provider, user: req.user.id })
        const providerName = req.params.provider
        const accountsFactory: any = container.resolve('accountsFactory')
        const provider = accountsFactory.getProvider(providerName)

        if (provider) {
            res.render(provider.template, {
                ...getGoogleAccountDisplay(),
                title: i18n.__('provider.connect.title') + provider.name,
                code: req.query.code,
                path: req.path
            })
        }
        else {
            res.status(NOT_FOUND_CODE)
            res.render('error.twig', {
                code: NOT_FOUND_CODE,
                title: '404 Account Not Found'
            })
            return
        }
    }
    catch (err) {
        logger.error('Error showing add account', { provider: req.params.provider, user: req.user.id })
        next(err)
    }
}

/**
 * POST /settings/add/:provider
 * Accounts page.
 */
export const postAddAccount = async (req: Request, res: Response, next: NextFunction) => {
    const providerName = req.params.provider
    const accountsFactory: any = container.resolve('accountsFactory')
    const provider = accountsFactory.getProvider(providerName)
    const userId = req.user.id
    logger.info('Adding account', { provider: req.params.provider, userId })

    try {
        const email = req.body.email
        const password = req.body.password
        const code  = req.body.code
        const uri = req.body.uri

        const accountsCommand: any = container.resolve('accountsCommand')

        await accountsCommand.addAccount(container, provider, providerName, email, password, code, uri, userId)

        const REDIRECT_ROUTE = req.user.isOnboardingFinished ? '/settings#accounts' : '/welcome'

        return res.redirect(REDIRECT_ROUTE)

    } catch (err) {
        const message = err.description ? err.description : err.message
        logger.error('Error adding account', { provider: req.params.provider, user: req.user.id, description: message, err})
        
        const isOperationalError = await ErrorHandler.handleError(err).isOperational
        if (!isOperationalError) {
            next(err)
        } else {
            renderProviderError(req, res, provider, message)
        }
    }

}

const renderProviderError = (req: Request, res: Response, provider: AuthenticableProvider, error: string) => {
    res.render(provider.template, {
        ...getGoogleAccountDisplay(),
        title: i18n.__('provider.connect.title') + provider.name,
        code: req.body.code,
        error,
        path: req.path
    })
}

/**
 * GET /accounts/:id/delete
 * Delete account action.
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user.id
        const providerId = req.params.providerId
        logger.info('Deleting account', { providerId, userId })

        const accountsCommand: any = container.resolve('accountsCommand')

        await accountsCommand.deleteAccount(container, providerId, userId)

        return res.redirect('/settings#accounts')
    }
    catch (err) {
        logger.error('Error deleting account', { provider: req.params.providerId, user: req.user.id })
        next(err)
    }
}
