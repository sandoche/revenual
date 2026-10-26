import appErrorTypes from '../../constants/appErrorTypes'

const getErrorMessageFromCode = (code: number): string => {
    if(!code && code !== 0) { // eslint-disable-line
        return null
    }
    let message = appErrorTypes.GenericError.message
    for (const errorType in appErrorTypes) {
        // @ts-ignore
        if (appErrorTypes[errorType].code === code) { // eslint-disable-line
            // @ts-ignore
            message = appErrorTypes[errorType].message // eslint-disable-line
            break
        }
    }
    return message
}

export default getErrorMessageFromCode
