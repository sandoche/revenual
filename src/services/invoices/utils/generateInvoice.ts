import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'
import logger from '../../../util/logger'
import XlsxPopulate from 'xlsx-populate'
import { InvoiceableReportProvider } from '../invoiceableReport/InvoiceableReportProvider'

export default async (self: InvoiceableReportProvider, templateName: string): Promise<any> => {
    try {
        logger.info('Starting invoice generation', { supplier: self.supplierAddress })
        const workbook = await XlsxPopulate.fromFileAsync(`templates/${templateName}.xlsx`)

        workbook.definedName('invoice_number').value(self.invoiceNumber)
        workbook.definedName('invoice_date').value(self.invoiceDate.toLocaleDateString())
        workbook.definedName('payment_date').value(self.paymentDate.toLocaleDateString())
        workbook.definedName('address_supplier').value(self.supplierAddress)
        workbook.definedName('address_partner').value(self.partnerAddress)
        workbook.definedName('units').value(self.unitsSold)
        workbook.definedName('sales').value(self.sales)
        workbook.definedName('tax') && workbook.definedName('tax').value(self.taxes)
        workbook.definedName('fees').value(self.fees)
        workbook.definedName('total').value(self.earnings)

        const data = await workbook.outputAsync()
        return data
    } catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.InvoiceGenerationError, 'Could not generate the invoice', true, true, {}, err)
    }
}