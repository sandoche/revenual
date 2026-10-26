import AppleReporter from 'apple-reporter'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'

export const getAppleToken = async (data: any): Promise<string> => {
    try {
        const reporter = new AppleReporter({
            userid: data.email,
            password: data.password,
            tokenOptions: {
                forceRetrieve: true,
                generateNewIfNeeded: true
            }
        })
    
        const { token } = await reporter.retrieveAccessToken({ forceRetrieve: true, generateNewIfNeeded: true })
    
        return token
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.AppleCredentialsError,'Could not retrieve Apple Access Token', true, true, {userid: data.email}, err)
    }
}

