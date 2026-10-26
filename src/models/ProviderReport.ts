import mongoose from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

import { AccountDocument } from './Account'
import { ReportDocument } from './Report'

export interface ProviderReportSimple {
    createdAt: Date;
    year: number;
    month: number;
    providerType: string;
    data: string;
    accountId: string;
    account: AccountDocument;
    report: ReportDocument;
}

export type ProviderReportDocument = mongoose.Document & ProviderReportSimple

const providerReportSchema  = new mongoose.Schema({
    createdAt: Date,
    year: Number,
    month: Number,
    providerType: String,
    data: String,
    accountId: String,
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }
})

providerReportSchema.plugin(AutoIncrement, {inc_field: 'id'}) // eslint-disable-line

export const ProviderReport = mongoose.model<ProviderReportDocument>('ProviderReport', providerReportSchema)
