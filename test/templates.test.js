const XlsxPopulate = require('xlsx-populate')
const generateInvoice = require('../src/services/invoices/utils/generateInvoice').default

test.each(['appstore', 'googleplay'])('%s template keeps its named inputs and generates a synthetic invoice', async provider => {
    const template = await XlsxPopulate.fromFileAsync(`templates/${provider}.xlsx`)
    for (const name of ['invoice_number', 'invoice_date', 'payment_date', 'address_supplier', 'address_partner', 'units', 'sales', 'fees', 'total']) {
        expect(template.definedName(name)).toBeTruthy()
        expect(template.definedName(name).value()).toBeUndefined()
    }
    const data = { invoiceNumber: 1, invoiceDate: new Date('2025-01-01T00:00:00Z'), paymentDate: new Date('2025-02-01T00:00:00Z'),
        supplierAddress: 'Example Supplier', partnerAddress: 'Example Partner', unitsSold: 2, sales: 20, fees: -6, taxes: -2, earnings: 12 }
    const buffer = await generateInvoice(data, provider)
    const invoice = await XlsxPopulate.fromDataAsync(buffer)
    expect(invoice.definedName('address_supplier').value()).toBe(data.supplierAddress)
    expect(invoice.definedName('total').value()).toBe(12)
})
