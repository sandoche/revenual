import passport from 'passport'
import passportLocal from 'passport-local'
import passportFacebook from 'passport-facebook'
import _ from 'lodash'

// import { User, UserType } from '../models/User';
import { User } from '../models/User'
import { Request, Response, NextFunction } from 'express'

const LocalStrategy = passportLocal.Strategy
const FacebookStrategy = passportFacebook.Strategy

passport.serializeUser<any, any>((user, done) => {
    done(undefined, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id, (err: Error, user: any) => {
        done(err, user)
    })
})


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err: Error, user: any) => {
        if (err) { return done(err) }
        if (!user) {
            return done(undefined, false, { message: 'Invalid email or password.' })
        }
        user.comparePassword(password, (err: Error, isMatch: boolean) => {
            if (err) { return done(err) }
            if (isMatch) {
                return done(undefined, user)
            }
            return done(undefined, false, { message: 'Invalid email or password.' })
        })
    })
}))


/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Login Required middleware.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

/**
 * Authorization Required middleware.
 */
export const isAuthorized = (req: Request, res: Response, next: NextFunction) => {
    const provider = req.path.split('/').slice(-1)[0] // eslint-disable-line

    if (_.find(req.user.tokens, { kind: provider })) {
        next()
    } else {
        res.redirect(`/auth/${provider}`)
    }
}
