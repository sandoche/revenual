import { ValidableAccount, RefreshableAccount } from './account'
import { UserDocument } from '../../../models/User'
import { AccountDocument } from '../../../models/Account'
import { checkAppleToken } from '../utils/checkAppleToken'
import { refreshAppleToken } from '../utils/refreshAppleToken'

export class ValidableAppstore implements ValidableAccount {
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
        this.credentials = account.credentials
        this.isValid = false
    }

    async validate() {
        this.isValid = await checkAppleToken(this.id, this.credentials)
        return this
    }
}

export class RefreshableAppstore implements RefreshableAccount {
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
        this.credentials = await refreshAppleToken(this.id, this.credentials)
        return this
    }
}