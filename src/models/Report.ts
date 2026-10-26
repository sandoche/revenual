import mongoose from 'mongoose'
import { UserDocument } from './User'
import { ProviderReportDocument } from './ProviderReport'
import { EarningDocument } from './Earning'

export type ReportDocument = mongoose.Document & {
    createdAt: Date;
    year: number;
    month: number;
    status: string;
    user: UserDocument;
    providerReports: ProviderReportDocument[];
    earnings: EarningDocument[];
    merchantCurrency: string;
    exchangeRateUpdate: Date;
};

export const reportSchema = new mongoose.Schema({
    createdAt: Date,
    year: Number,
    month: Number,
    status: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    providerReports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderReport'
    }],
    earnings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Earning'
    }],
    merchantCurrency: String,
    exchangeRateUpdate: Date
})

export const Report = mongoose.model<ReportDocument>('Report', reportSchema)
