import logger from '../../util/logger'

class AppError {
    commonType: string;
    appType: any;
    description: string;
    isOperational: boolean;
    isTrustedError: boolean;
    error: any;
    metaData: string;
    appTypeString: string;

    constructor (commonType: any, appType: any, description: string, isOperational: boolean, isTrustedError: boolean, metaData: any = null, error: any = null) {
        Error.call(this)
        Error.captureStackTrace(this)
        this.appType = appType
        this.commonType = commonType
        this.description = description
        this.isOperational = isOperational
        this.isTrustedError = isTrustedError
        this.metaData = JSON.stringify(metaData)
        this.appTypeString = JSON.stringify(appType)
        this.error = error
        logger.error(error)
    }
}

export default AppError