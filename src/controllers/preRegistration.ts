import { Request, Response } from 'express'
import logger from '../util/logger'
import container from '../services/servicesContainer'
import { PreRegisteredUserDocument } from '../models/PreRegisteredUser'
import mongoose from 'mongoose'

/**
 * POST /api/v1/pre-signup
 * Save the pre-signup data in the database
 */
export const preSignup = async (req: Request, res: Response) => {
    let success = false
    let id = null

    try {
        const { email } = req.body
        const PreRegisteredUser: mongoose.Model<PreRegisteredUserDocument> = container.resolve('PreRegisteredUser')

        logger.info('Saving email received', { email })
        const preRegisteredUser = new PreRegisteredUser({ email })

        await preRegisteredUser.save()
        success = true
        id = preRegisteredUser._id
    } catch (err) {
        logger.info('Invalid email', { err })
    }

    res.setHeader('Content-Type', 'application/json')
    res.json({ success, id })
}