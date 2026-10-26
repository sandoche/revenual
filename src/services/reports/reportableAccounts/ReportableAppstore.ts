import { ReportableAccount } from './ReportableAccount'
import { AccountDocument } from '../../../models/Account'
import { UserDocument } from '../../../models/User'
import { downloadReportAppstore } from '../utils/downloadReportAppstore'
import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'

export class ReportableAppstore implements ReportableAccount {
    type: string
    credentials: string
    id: string
    createdAt: Date
    user: UserDocument
    reportData: string
    _id: string
    month: number
    year: number
    constructor(account: AccountDocument, month: number, year: number) {
        this.type = account.type
        this.id = account.id
        this._id = account._id
        this.credentials = account.credentials
        this.createdAt = account.createdAt
        this.user = account.user
        this.month = month
        this.year = year
        return this
    }

    async download() {
        try {
            this.reportData = await downloadReportAppstore(this.id, this.credentials, this.month, this.year)
            return this
        }
        catch (err) {
            this.reportData = null
            return this
        }
    }
}