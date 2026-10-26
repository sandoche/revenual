import mongoose from 'mongoose'
import { UserDocument } from './User'
import { ReportDocument } from './Report'
import { AccountDocument } from './Account'

export interface EarningSimple {
    user: UserDocument;
    report: ReportDocument;
    account: AccountDocument;
    accountId: string;
    providerType: string;
    createdAt: Date;
    year: number;
    month: number;
    transactionDate: Date;
    productTitle: string;
    productId: string;
    units: number;
    countryCode: string;
    buyerCurrency: string;
    exchangeRate: number;
    merchantCurrency: string;
    unitSalePriceBuyerCurrency: number;
    unitFeePriceBuyerCurrency: number;
    unitTaxBuyerCurrency: number;
    totalEarningBuyerCurrency: number;
    unitSalePriceMerchantCurrency: number;
    unitFeeMerchantCurrency: number;
    unitTaxMerchantCurrency: number;
    totalEarningMerchantCurrency: number;
    exhangeRateUpdateDate: Date;
    transactionId: string;
    reportId: string;
    isRefund: boolean;
}

export type EarningDocument = mongoose.Document & EarningSimple

export const earningSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },
    accountId: String,
    providerType: String,
    createdAt: Date,
    year: Number,
    month: Number,
    transactionDate: Date,
    productTitle: String,
    productId: String,
    units: Number,
    countryCode: String,
    buyerCurrency: String,
    exchangeRate: Number,
    merchantCurrency: String,
    unitSalePriceBuyerCurrency: Number,
    unitFeePriceBuyerCurrency: Number,
    unitTaxBuyerCurrency: Number,
    totalEarningBuyerCurrency: Number,
    unitSalePriceMerchantCurrency: Number,
    unitFeeMerchantCurrency: Number,
    unitTaxMerchantCurrency: Number,
    totalEarningMerchantCurrency: Number,
    exhangeRateUpdateDate: Date,
    transactionId: String,
    reportId: String,
    isRefund: Boolean
})

export const Earning = mongoose.model<EarningDocument>('Earning', earningSchema)