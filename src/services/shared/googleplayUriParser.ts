import AppError from './AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'

export const parseUri = (uri: string): string => {
    try {
        const uriParsed = uri.split('gs://')[1].split('/')[0] // eslint-disable-line
        return uriParsed
    }
    catch(err) {
        throw new AppError(errorTypes.ValidationError, appErrorTypes.GoogleInvalidUri, 'Invalid Google Play URI', true, true, { uri }, err)
    }
}
