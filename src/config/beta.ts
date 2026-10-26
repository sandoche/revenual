import { Request, Response, NextFunction } from 'express'

export const betaGate = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.BASIC_AUTH_PRIVATE_BETA !== 'TRUE' ||
        !(req.originalUrl.includes('/login') || req.originalUrl.includes('/signup'))) return next()
    const [, encoded = ''] = (req.headers.authorization || '').split(' ')
    const [login, password] = Buffer.from(encoded, 'base64').toString().split(':')
    if (login && password && login === process.env.BASIC_AUTH_USERNAME && password === process.env.BASIC_AUTH_PASSWORD) return next()
    res.set('WWW-Authenticate', 'Basic realm="Revenual beta"')
    const UNAUTHORIZED = 401
    return res.status(UNAUTHORIZED).send('Authentication required for the private beta.')
}
