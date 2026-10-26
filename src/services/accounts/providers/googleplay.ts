import { Provider, LinkableProvider, AuthenticableProvider } from './provider'
import { checkGoogleAccess } from '../utils/checkGoogleAccess'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'

export const googleplay: Provider = {
    slug: 'googleplay',
    name: 'Google Play'
}

export const linkableGoogleplay: LinkableProvider = {
    ...googleplay,
    url: '/accounts/add/googleplay'
}

export const authenticableGoogleplay: AuthenticableProvider = {
    ...googleplay,
    getToken: async (data: any): Promise<string> => {
        try {
            const isAccessGranted = await checkGoogleAccess(data, true)

            if (isAccessGranted) {
                return ''
            } else {
                throw new AppError(errorTypes.Error, appErrorTypes.GoogleTokenError, 'Sorry, we could not access your Google Play\'s financial data, please check that you followed the instruction below', true, true, {}, null)
            }
        }
        catch (err) {
            throw new AppError(errorTypes.Error, appErrorTypes.GoogleTokenError, 'Sorry, we could not access your Google Play\'s financial data, please check that you followed the instruction below', true, true, {}, err)
        }
    },
    template: 'provider/googleplay.twig'
}
