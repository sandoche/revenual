import AppError from './AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/errorTypes'

const createError = (err: AppError): AppError => {
    let errorCreated: AppError
    if (err.error && err.error.commonType) {
        errorCreated = new AppError(err.error.commonType, err.error.appType, err.error.description, err.error.isOperational, err.error.isTrustedError, err.error.metaData, err.error.error)
    } else if (err.commonType) {
        errorCreated = new AppError(err.commonType, err.appType, err.description, err.isOperational, err.isTrustedError, err.metaData, err)
    } else {
        errorCreated = new AppError(errorTypes.Error, appErrorTypes.Error, 'Sorry something wrong happened', true, true, null, err)
    }

    return errorCreated
}

export default createError