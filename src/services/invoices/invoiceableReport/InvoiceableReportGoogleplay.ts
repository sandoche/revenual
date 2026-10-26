import { InvoiceableReportProvider } from './InvoiceableReportProvider'
import generateInvoice from '../utils/generateInvoice'

export class InvoiceableReportGoogleplay implements InvoiceableReportProvider {
    invoiceNumber: number
    invoiceDate: Date
    paymentDate: Date
    supplierAddress: string
    partnerAddress: string
    unitsSold: number
    sales: number
    taxes: number
    fees: number
    earnings: number

    constructor(data: any) {
        this.setInvoiceDate(data)
        this.setPaymentDate(data)

        this.invoiceNumber = data.invoiceNumber
        this.supplierAddress = data.supplierAddress
        this.partnerAddress = data.partnerAddress
        this.unitsSold = data.providerEarnings.units
        this.sales = data.providerEarnings.sales
        this.taxes = data.providerEarnings.taxes
        this.fees = data.providerEarnings.fees
        this.earnings = data.providerEarnings.earnings

        return this
    }

    setInvoiceDate(data: any) {
        const DEFAULT_DAY_OF_INVOICE = 1
        let invoiceDate = new Date()
        invoiceDate.setFullYear(data.year)
        invoiceDate.setMonth(data.month)
        invoiceDate.setDate(DEFAULT_DAY_OF_INVOICE)
        this.invoiceDate = invoiceDate
        return this
    }

    setPaymentDate(data: any) {
        const DEFAULT_PAYEMENT_DAY = 15
        let paymentDate = new Date()
        paymentDate.setFullYear(data.year)
        paymentDate.setMonth(data.month)
        paymentDate.setDate(DEFAULT_PAYEMENT_DAY)
        this.paymentDate = paymentDate
        return this
    }

    async generateInvoice(): Promise<any> {
        return await generateInvoice(this, 'googleplay')
    }
}