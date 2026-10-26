import { Provider, LinkableProvider, AuthenticableProvider } from './provider'
import { getAppleToken } from '../utils/getAppleToken'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'

export const appstore: Provider = {
    slug: 'appstore',
    name: 'Apple AppStore'
}

export const linkableAppstore: LinkableProvider = {
    ...appstore,
    url: '/accounts/add/appstore'
}

export const authenticableAppstore: AuthenticableProvider = {
    ...appstore,
    getToken: (data: object): Promise<string> => {
        try {
            return getAppleToken(data)
        }
        catch (err) {
            throw new AppError(errorTypes.Error, appErrorTypes.AppleTokenError, 'Invalid email or app specific password', true, true, {}, err)
        }
    },
    template: 'provider/appstore.twig'
}