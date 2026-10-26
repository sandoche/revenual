import { Request, Response } from 'express'

/**
 * GET /version
 * Returns current version of the webapp
 */
export const getVersion = async (req: Request, res: Response) => {
    const pjson = require('../../package.json') // eslint-disable-line

    res.setHeader('Content-Type', 'application/json')
    res.json({ running: true, ping: 'pong', version: pjson.version, author: 'Sandoche Adittane' })
}