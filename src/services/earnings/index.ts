import { UserDocument } from '../../models/User'
import { ReportDocument } from '../../models/Report'
import earningQueryBuilder from './utils/earningQueryBuilder'
import AppError from '../shared/AppError'
import errorTypes from '../../constants/errorTypes'
import appErrorTypes from '../../constants/appErrorTypes'
import logger from '../../util/logger'
import { AwilixContainer } from 'awilix'

const getTotal = async (container: AwilixContainer, reportId: string, user: UserDocument, report: ReportDocument): Promise<any> => {
    try {
        logger.info('Getting the earnings report total', { reportId, userId: user._id.toString() })
        const query = earningQueryBuilder(container, reportId, { user, report })
        return await query()
    }
    catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ReportError, 'Could not get total report from MongoDB', true, true, { reportId, userId: user._id.toString() }, err)
    }
}

const getPerProduct = async (container: AwilixContainer, reportId: string, user: UserDocument, report: ReportDocument): Promise<any> => {
    try {
        logger.info('Getting the earnings per product', { reportId, userId: user._id.toString() })
        const query = earningQueryBuilder(container, reportId, { user, report, productId: '$productId' })
        return await query()
    }
    catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ReportError, 'Could not get per product report from MongoDB', true, true, { reportId, userId: user._id.toString() }, err)
    }
}

const getPerProvider = async (container: AwilixContainer, reportId: string, user: UserDocument, report: ReportDocument): Promise<any> => {
    try {
        logger.info('Getting the earnings per provider', { reportId, userId: user._id.toString() })
        const query = earningQueryBuilder(container, reportId, { user, report, providerType: '$providerType' })
        return await query()
    }
    catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ReportError, 'Could not get per provider report from MongoDB', true, true, { reportId, userId: user._id.toString() }, err)
    }
}

const getPerCountry = async (container: AwilixContainer, reportId: string, user: UserDocument, report: ReportDocument): Promise<any> => {
    try {
        logger.info('Getting the earnings per country', { reportId, userId: user._id.toString() })
        const query = earningQueryBuilder(container, reportId, { user, report, countryCode: '$countryCode' })
        return await query()
    }
    catch (err) {
        throw new AppError(errorTypes.DataError.MongoDBError, appErrorTypes.ReportError, 'Could not get per country report from MongoDB', true, true, { reportId, userId: user._id.toString() }, err)
    }
}

export default {
    getTotal,
    getPerProduct,
    getPerProvider,
    getPerCountry
}