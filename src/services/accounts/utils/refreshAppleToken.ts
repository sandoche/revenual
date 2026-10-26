import AppleReporter from 'apple-reporter'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'

export const refreshAppleToken = async (id: string, accesstoken: string): Promise<string> => {
    try {
        const reporter: any = new AppleReporter({
            userid: id,
            accesstoken
        })

        const { token } = await reporter.retrieveAccessToken({ generateNewIfNeeded: true })

        return token
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.AppleTokenError, 'Could not refresh Apple Access Token', true, true, {userid: id}, err)
    }
}

