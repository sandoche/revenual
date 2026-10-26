import logger from '../../util/logger'

class ErrorHandler {
    isOperational: boolean;
    isTrustedError: boolean;
    handleError (error: any) {
        logger.error(error)
        this.isOperational = error.isOperational ? error.isOperational : false
        this.isTrustedError = error.isTrustedError ? error.isTrustedError : false

        return this
    }
}

export default new ErrorHandler()

