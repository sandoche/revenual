import mongoose from 'mongoose'
import { UserDocument } from './User'

export type SubscriptionDocument = mongoose.Document & {
    startDate: Date;
    endDate: Date;
    type: string;
    subscriptionId: string;
    customerId: string;
    productId: string;
    user: UserDocument;
    isCanceled: boolean;
    isManual: boolean;
};

export const subscriptionSchema = new mongoose.Schema({
    startDate: Date,
    endDate: Date,
    type: String,
    subscriptionId: String,
    customerId: String,
    productId: String,
    isCanceled: Boolean,
    isManual: Boolean,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

export const Subscription = mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema)
