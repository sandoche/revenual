import mongoose from 'mongoose'
import { UserDocument } from './User'

export interface AccountSimple {
    type: string;
    credentials: string;
    id: string;
    createdAt: Date;
    user: UserDocument;
}
export type AccountDocument = mongoose.Document & AccountSimple

const accountSchema = new mongoose.Schema({
    type: String,
    credentials: String,
    id: String,
    createdAt: Date,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

export const Account = mongoose.model<AccountDocument>('Account', accountSchema)
