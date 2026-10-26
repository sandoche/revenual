import { ValidableAccount, RefreshableAccount } from './account'
import { UserDocument } from '../../../models/User'
import { AccountDocument } from '../../../models/Account'
import { checkGoogleAccess } from '../utils/checkGoogleAccess'

export class ValidableGoogleplay implements ValidableAccount {
    type: string
    credentials: string
    id: string
    createdAt: Date
    user: UserDocument
    isValid: boolean
    _id: string

    constructor(account: AccountDocument) {
        this.type = account.type
        this.id = account.id
        this._id = account._id
        this.isValid = false
        this.credentials = account.credentials
    }
    async validate() {
        const isAccessGranted = await checkGoogleAccess({ uri: this.id }, false)
        this.isValid = isAccessGranted
    }
}

export class RefreshableGoogleplay implements RefreshableAccount {
    type: string
    credentials: string
    id: string
    createdAt: Date
    user: UserDocument
    constructor(account: AccountDocument) {
        this.type = account.type
        this.id = account.id
        this.credentials = account.credentials
    }

    async refreshToken() {
        return this
    }
}