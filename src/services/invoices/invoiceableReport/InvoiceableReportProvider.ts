export interface InvoiceableReportProvider {
    invoiceNumber: number;
    invoiceDate: Date;
    paymentDate: Date;
    supplierAddress: string;
    partnerAddress: string;
    unitsSold: number;
    sales: number;
    taxes: number;
    fees: number;
    earnings: number;
    generateInvoice(): Promise<any>;
}