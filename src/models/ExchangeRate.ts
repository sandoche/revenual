import mongoose from 'mongoose'

export interface ExchangeRateSimple {
    from: string;
    to: string;
    rate: number;
}

export type ExchangeRateDocument = mongoose.Document & ExchangeRateSimple & {
    year: number;
    month: number;
};

const exchangeRateSchema = new mongoose.Schema({
    year: Number,
    month: Number,
    from: String,
    to: String,
    rate: Number
})

export const ExchangeRate = mongoose.model<ExchangeRateDocument>('ExchangeRate', exchangeRateSchema)
