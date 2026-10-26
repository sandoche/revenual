import { Logger, LoggerOptions, transports } from 'winston'

const options: LoggerOptions = {
    transports: [
        new transports.Console({
            level: 'debug'
        }),
        new transports.File({ filename: 'debug.log', level: 'debug' })
    ]
}

const logger = new Logger(options)

if (process.env.NODE_ENV !== 'production') {
    logger.debug('Logging initialized at debug level')
}

export default logger
