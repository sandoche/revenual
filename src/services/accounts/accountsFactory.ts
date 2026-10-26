import { LinkableProvider, AuthenticableProvider } from './providers/provider'
import { linkableGoogleplay, authenticableGoogleplay } from './providers/googleplay'
import { linkableAppstore, authenticableAppstore } from './providers/appstore'
import { AccountDocument } from '../../models/Account'
import { ValidableAccount } from './accounts/account'
import { ValidableGoogleplay } from './accounts/googleplay'
import { ValidableAppstore } from './accounts/appstore'
import { RefreshableAccount } from './accounts/account'
import { RefreshableGoogleplay } from './accounts/googleplay'
import { RefreshableAppstore } from './accounts/appstore'
import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'

const getProviders = (providerConfig: string[]): LinkableProvider[] => {
    const providers: LinkableProvider[] = []

    if (providerConfig.includes('googleplay')) {
        providers.push(linkableGoogleplay)
    }

    if (providerConfig.includes('appstore')) {
        providers.push(linkableAppstore)
    }

    return providers
}

const getProvider = (providerName: string): AuthenticableProvider => {
    let provider: AuthenticableProvider

    if (providerName === 'appstore') {
        provider = authenticableAppstore
    }
    else if (providerName === 'googleplay') {
        provider = authenticableGoogleplay
    }
    else {
        provider = null
    }

    return provider
}

const getAccountsWithValidation = async (accounts: AccountDocument[]): Promise<ValidableAccount[]> => {
    const accountsWithValidation: ValidableAccount[] = []

    for (const account of accounts) {
        let accountWithValidation: ValidableAccount

        if (account.type === 'appstore') {
            accountWithValidation = new ValidableAppstore(account)
        }
        else if (account.type === 'googleplay') {
            accountWithValidation = new ValidableGoogleplay(account)
        }

        await accountWithValidation.validate()
        accountsWithValidation.push(accountWithValidation)
    }

    return accountsWithValidation
}

const getInvalidAccounts = async (accounts: AccountDocument[]): Promise<ValidableAccount[]> => {
    const accountsWithValidation = await getAccountsWithValidation(accounts)
    const invalidAccounts = accountsWithValidation.filter((account) => {
        return account.isValid === false
    })

    return invalidAccounts
}

const refreshTokens = async (accounts: AccountDocument[]): Promise<void> => {
    try {
        for (const account of accounts) {
            let refreshableAccount: RefreshableAccount

            if (account.type === 'appstore') {
                refreshableAccount = new RefreshableAppstore(account)
            }
            else if (account.type === 'googleplay') {
                refreshableAccount = new RefreshableGoogleplay(account)
            }

            logger.info('Refrehsing token', { accountId: account.id, type: account.type })
            await refreshableAccount.refreshToken()
            account.credentials = refreshableAccount.credentials
            await account.save()
        }
    } catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.TokenRefreshError, 'Could not refresh tokens', true, true, {}, err)
    }
}

export default {
    getProviders,
    getProvider,
    getAccountsWithValidation,
    getInvalidAccounts,
    refreshTokens
}