import bcrypt from 'bcrypt-nodejs'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { AccountDocument } from './Account'
import { ReportDocument } from './Report'
import { EarningDocument } from './Earning'
import { SubscriptionDocument } from './Subscription'

export type UserDocument = mongoose.Document & {
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;

    facebook: string;
    tokens: AuthToken[];

    settings: {
        currency: string;
        address: string;
        googleplay: {
            address: string;
        };
        appstore: {
            address: string;
        };
    };

    userSubscriptionsInformation: {
        maxProductsSold: number;
        maxProductsSoldDate: Date;
    };

    profile: {
        name: string;
        gender: string;
        location: string;
        website: string;
        picture: string;
    };

    comparePassword: comparePasswordFunction;
    gravatar: (size: number) => string;
    accounts: AccountDocument[];
    reports: ReportDocument[];
    earnings: EarningDocument[];
    subscriptions: SubscriptionDocument[];
    createdAt: Date;
    isOnboardingFinished: boolean;
};

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export interface AuthToken {
    accessToken: string;
    kind: string;
}

export const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    facebook: String,
    twitter: String,
    google: String,
    tokens: Array,

    settings: {
        currency: String,
        address: String,
        googleplay: {
            address: String
        },
        appstore: {
            address: String
        }
    },

    userSubscriptionsInformation: {
        maxProductsSold: Number,
        maxProductsSoldDate: Date,
    },

    profile: {
        name: String,
        gender: String,
        location: String,
        website: String,
        picture: String
    },
    accounts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    }],
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }],
    earnings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Earning'
    }],
    subscriptions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription'
    }],
    createdAt: Date,
    isOnboardingFinished: Boolean
}, { timestamps: true })

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
    const user = this as UserDocument
    if (!user.isModified('password')) { return next() }
    const ROUNDS = 10
    bcrypt.genSalt(ROUNDS, (err, salt) => { 
        if (err) { return next(err) }
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) { return next(err) }
            user.password = hash
            next()
        })
    })
})

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch)
    })
}

userSchema.methods.comparePassword = comparePassword

/**
 * Helper method for getting user's gravatar.
 */
const GRAVATAR_SIZE = 200
userSchema.methods.gravatar = function (this: UserDocument, size: number = GRAVATAR_SIZE) {
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`
    }
    const md5 = crypto.createHash('md5').update(this.email).digest('hex')
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`
}

export const User = mongoose.model<UserDocument>('User', userSchema)
