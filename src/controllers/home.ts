import { Request, Response } from 'express'

/**
 * GET /
 * Home page.
 */
export const index = (req: Request, res: Response) => {
    return res.redirect('/reports')
}
