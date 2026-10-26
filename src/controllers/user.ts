import async from 'async'
import crypto from 'crypto'
import passport from 'passport'
import { User, UserDocument, AuthToken } from '../models/User'
import { Request, Response, NextFunction } from 'express'
import { IVerifyOptions } from 'passport-local'
import { WriteError } from 'mongodb' // eslint-disable-line
import { check, sanitize, validationResult } from 'express-validator'
import container from '../services/servicesContainer'
import mongoose from 'mongoose'
import logger from '../util/logger'
import '../config/passport'
import { PreRegisteredUserDocument } from '../models/PreRegisteredUser'

const mailjet = require ('node-mailjet')
    .connect(process.env.MAILJET_USER, process.env.MAILJET_PASSWORD)

/**
 * GET /login
 * Login page.
 */
export const getLogin = (req: Request, res: Response) => {   
    if (req.user) {
        return res.redirect('/reports')
    }

    res.render('login.twig', {
        title: 'Login',
        path: req.path
    })
}

/**
 * POST /login
 * Sign in using email and password.
 */
export const postLogin = async (req: Request, res: Response, next: NextFunction) => {
    await check('email', 'Email is not valid').isEmail().run(req)
    await check('password', 'Password cannot be blank').isLength({ min: 1 }).run(req)
    // eslint-disable-next-line @typescript-eslint/camelcase
    sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/login')
    }

    passport.authenticate('local', (err: Error, user: UserDocument, info: IVerifyOptions) => {
        if (err) { return next(err) }
        if (!user) {
            req.flash('errors', { msg: info.message })
            return res.redirect('/login')
        }
        req.logIn(user, (err) => {
            if (err) { return next(err) }
            res.redirect(req.session.returnTo || '/reports')
        })
    })(req, res, next)
}

/**
 * GET /logout
 * Log out.
 */
export const logout = (req: Request, res: Response) => {
    req.logout()
    res.redirect('/login')
}

/**
 * GET /signup
 * Signup page.
 */
export const getSignup = async (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect('/reports')
    }

    let email = null

    const id = req.query.id
    logger.info('Looking for the preRegistration id', { id })
    
    if (id) {
        const PreRegisteredUser: mongoose.Model<PreRegisteredUserDocument> = container.resolve('PreRegisteredUser')
        const preRegisteredUser = await PreRegisteredUser.findOne({ _id: id })
        email = preRegisteredUser.email
    }

    const currencyCodes: any = container.resolve('currencyCodes')
    const termsPage = process.env.HOST_LANDING_PAGE + '/terms-of-use'
    const cookiesPage = process.env.HOST_LANDING_PAGE + '/cookie-policy'
    const privacyPage = process.env.HOST_LANDING_PAGE + '/privacy-policy'

    res.render('signup.twig', {
        title: 'Create Account',
        currencyCodes,
        termsPage,
        cookiesPage,
        privacyPage,
        path: req.path,
        email
    })
}

/**
 * POST /signup
 * Create a new local account.
 */
export const postSignup = async (req: Request, res: Response, next: NextFunction) => {
    await check('email', 'Email is not valid').isEmail().run(req)
    await check('password', 'Password must be at least 8 characters long').isLength({ min: 8 }).run(req)
    await check('confirmPassword', 'Passwords do not match').equals(req.body.password).run(req)
    // eslint-disable-next-line @typescript-eslint/camelcase
    sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/signup')
    }

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        settings: {
            currency: 'USD',
            googleplay: {
                address: `Google Commerce Ltd Gordon House, 
Barrow Street Dublin 4 Ireland 
VAT registration: IE9825613N`
            },
            appstore: {
                address: `Apple Distribution International 
Internet Software & Services Hollyhill Industrial 
Estate Hollyhill, 
Cork Republic of Ireland
VAT ID: IE9700053D`
            }
        },
        createdAt: new Date(),
        isOnboardingFinished: false
    })

    User.findOne({ email: req.body.email }, (err: Error, existingUser: UserDocument) => {
        if (err) { return next(err) }
        if (existingUser) {
            req.flash('errors', { msg: 'Account with that email address already exists.' })
            return res.redirect('/signup')
        }
        user.save((err) => {
            if (err) { return next(err) }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err)
                }
                res.redirect('/welcome')
            })
        })
    })
}

/**
 * POST /settings/profile
 * Update profile information.
 */
export const postUpdateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const currencyCodes: any = container.resolve('currencyCodes')
    await check('email', 'Please enter a valid email address.').isEmail().run(req)
    await check('currency', 'Currency is not valid').isIn(currencyCodes).run(req)
    // eslint-disable-next-line @typescript-eslint/camelcase
    sanitize('email').normalizeEmail({ gmail_remove_dots: false })

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/settings')
    }

    User.findById(req.user.id, (err: Error, user: UserDocument) => {
        if (err) { return next(err) }
        user.email = req.body.email || ''
        user.profile.name = req.body.name || ''
        user.profile.gender = req.body.gender || ''
        user.profile.location = req.body.location || ''
        user.profile.website = req.body.website || ''
        user.settings.currency = req.body.currency || ''
        user.settings.address = req.body.address || ''
        user.settings.googleplay.address = req.body.googleplay || ''
        user.settings.appstore.address = req.body.appstore || ''

        user.save((err: WriteError) => {
            if (err) {
                if (err.code === 11000) { // eslint-disable-line
                    req.flash('errors', { msg: 'The email address you have entered is already associated with an account.' })
                    return res.redirect('/settings')
                }
                return next(err)
            }
            req.flash('success', { msg: 'Profile information has been updated.' })
            res.redirect('/settings')
        })
    })
}

/**
 * POST /settings/password
 * Update current password.
 */
export const postUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
    await check('password', 'Password must be at least 8 characters long').isLength({ min: 8 }).run(req)
    await check('confirmPassword', 'Passwords do not match').equals(req.body.password).run(req)

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/settings')
    }

    User.findById(req.user.id, (err: Error, user: UserDocument) => {
        if (err) { return next(err) }
        user.password = req.body.password
        user.save((err: WriteError) => {
            if (err) { return next(err) }
            req.flash('success', { msg: 'Password has been changed.' })
            res.redirect('/settings')
        })
    })
}

/**
 * POST /settings/delete
 * Delete user account.
//  */
// export const postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
//     User.remove({ _id: req.user.id }, (err) => {
//         if (err) { return next(err) }
//         req.logout()
//         req.flash('info', { msg: 'Your account has been deleted.' })
//         res.redirect('process.env.HOST_LANDING_PAGE')
//     })
// }

/**
 * GET /reset/:token
 * Reset Password page.
 */
export const getReset = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return res.redirect('/reports')
    }
    User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err: Error, user: any) => {
            if (err) { return next(err) }
            if (!user) {
                req.flash('errors', { msg: 'Password reset token is invalid or has expired.' })
                return res.redirect('/forgot')
            }
            res.render('reset.twig', {
                title: 'Password Reset',
                path: req.path
            })
        })
}

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export const postReset = async (req: Request, res: Response, next: NextFunction) => {
    await check('password', 'Password must be at least 8 characters long.').isLength({ min: 8 }).run(req)
    await check('confirm', 'Passwords must match.').equals(req.body.password).run(req)

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('back')
    }

    async.waterfall([
        function resetPassword(done: Function) {
            User
                .findOne({ passwordResetToken: req.params.token })
                .where('passwordResetExpires').gt(Date.now())
                .exec((err: Error, user: any) => {
                    if (err) { return next(err) }
                    if (!user) {
                        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' })
                        return res.redirect('back')
                    }
                    user.password = req.body.password
                    user.passwordResetToken = undefined
                    user.passwordResetExpires = undefined
                    user.save((err: WriteError) => {
                        if (err) { return next(err) }
                        req.logIn(user, (err) => {
                            done(err, user)
                        })
                    })
                })
        },
        function sendResetPasswordEmail(user: UserDocument, done: Function) {
            const email = mailjet
                .post('send', {'version': 'v3.1'})
                .request({
                    'Messages':[{
                        'From': {
                            'Email': process.env.MAILJET_FROM_EMAIL,
                            'Name': process.env.MAILJET_FROM_NAME || 'Revenual'
                        },
                        'To': [{
                            'Email': user.email
                        }],
                        'Subject': 'Your password has been changed',
                        'TextPart': 'Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n',
                        'HTMLPart': 'Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n'
                    }]
                })
            email
                .then(() => {
                    req.flash('success', { msg: 'Success! Your password has been changed.' })
                    done()
                })
                .catch((err: any) => {
                    done(err)
                })
        }
    ], (err) => {
        if (err) { return next(err) }
        res.redirect('/reports')
    })
}

/**
 * GET /forgot
 * Forgot Password page.
 */
export const getForgot = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        return res.redirect('/reports')
    }
    res.render('forgot.twig', {
        title: 'Forgot Password',
        path: req.path
    })
}

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export const postForgot = async (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.MAILJET_USER || !process.env.MAILJET_PASSWORD || !process.env.MAILJET_FROM_EMAIL) {
        req.flash('errors', { msg: 'Password-reset email is not configured. Contact the administrator.' })
        return res.redirect('/forgot')
    }
    await check('email', 'Please enter a valid email address.').isEmail().run(req)
    // eslint-disable-next-line @typescript-eslint/camelcase
    await sanitize('email').normalizeEmail({ gmail_remove_dots: false }).run(req)

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/forgot')
    }

    async.waterfall([
        function createRandomToken(done: Function) {
            const SIZE = 16
            crypto.randomBytes(SIZE, (err, buf) => { // eslint-disable-line
                const token = buf.toString('hex')
                done(err, token)
            })
        },
        function setRandomToken(token: AuthToken, done: Function) {
            const ONE_HOUR_IN_SECONDS = 3600000
            User.findOne({ email: req.body.email }, (err: Error, user: any) => {
                if (err) { return done(err) }
                if (!user) {
                    req.flash('errors', { msg: 'Account with that email address does not exist.' })
                    return res.redirect('/forgot')
                }
                user.passwordResetToken = token
                user.passwordResetExpires = Date.now() + ONE_HOUR_IN_SECONDS
                user.save((err: WriteError) => {
                    done(err, token, user)
                })
            })
        },
        function sendForgotPasswordEmail(token: AuthToken, user: UserDocument, done: Function) {
            const email = mailjet
                .post('send', {'version': 'v3.1'})
                .request({
                    'Messages':[{
                        'From': {
                            'Email': process.env.MAILJET_FROM_EMAIL,
                            'Name': process.env.MAILJET_FROM_NAME || 'Revenual'
                        },
                        'To': [{
                            'Email': user.email
                        }],
                        'Subject': 'Reset your password on Revenual',
                        'TextPart': `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
                        Please click on the following link, or paste this into your browser to complete the process:\n\n
                        ${process.env.HOST_APP}/reset/${token}\n\n
                        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
                        'HTMLPart': `You are receiving this email because you (or someone else) have requested the reset of the password for your account.<br><br>
                        Please click on the following link, or paste this into your browser to complete the process:<br>
                        <a href="${process.env.HOST_APP}/reset/${token}">${process.env.HOST_APP}/reset/${token}</a><br><br>
                        If you did not request this, please ignore this email and your password will remain unchanged.`
                    }]
                })
            email
                .then(() => {
                    req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` })
                    done()
                })
                .catch((err: any) => {
                    done(err)
                })
        }
    ], (err) => {
        if (err) { return next(err) }
        res.redirect('/forgot')
    })
}
