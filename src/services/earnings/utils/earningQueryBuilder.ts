import { EarningDocument } from '../../../models/Earning'
import { AwilixContainer } from 'awilix'
import mongoose from 'mongoose'

export default (container: AwilixContainer, reportId: string, _id: any): any => {
    const Earning: mongoose.Model<EarningDocument> = container.resolve('Earning')
    const errorTypes: any = container.resolve('errorTypes')
    const AppError: any = container.resolve('AppError')
    const appErrorTypes: any = container.resolve('appErrorTypes')
    const DECIMALS = 2

    return async () => {
        try {
            const result = await Earning.aggregate([
                {
                    $match: {
                        'reportId': reportId
                    },
                },
                {
                    $group: {
                        _id: _id,
                        units: { $sum: '$units' },
                        salesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitSalePriceMerchantCurrency'] } },
                        feesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitFeeMerchantCurrency'] } },
                        taxesFull: { $sum: { $multiply: [{ $abs: '$units' }, '$unitTaxMerchantCurrency'] } },
                        earningsFull: { $sum: '$totalEarningMerchantCurrency' }
                    },
                },
                {
                    $project: {
                        _id: '$_id',
                        units: '$units',
                        sales: { $round: ['$salesFull', DECIMALS] },
                        fees: { $round: ['$feesFull', DECIMALS] },
                        taxes: { $round: ['$taxesFull', DECIMALS] },
                        earnings: { $round: ['$earningsFull', DECIMALS] }
                    }   
                },
                {
                    $sort: {
                        earnings: -1
                    }
                }
            ]).exec()

            return result
        }
        catch (err) {
            throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ReportError, 'Could not get earning report from MongoDB', true, true, { reportId, _id }, err)
        }
    }
}