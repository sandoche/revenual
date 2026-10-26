import { Request, Response } from 'express'

/**
 * GET /ideas-lab
 * Redirect to the idea lab
 */
export const getIdealab = (req: Request, res: Response) => {
    return res.redirect('https://revenual-ideaslab.herokuapp.com/')
}
