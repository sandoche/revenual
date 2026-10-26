import AppError from '../../shared/AppError'
import errorTypes from '../../../constants/errorTypes'
import appErrorTypes from '../../../constants/appErrorTypes'
import { getToken } from '../../shared/getGoogleplayToken'
import logger from '../../../util/logger'
import fetch from 'node-fetch'
import downloadFile from '../../shared/downloadFile'
import { FILE_DIRECTORY } from '../../../config/directory'
import AdmZip from 'adm-zip'
import fs from 'fs'

const API_ENDPOINT_HOST = 'https://www.googleapis.com/storage/v1/b/'
const API_ENDPOINT_ALL_REPORTS = '/o/'
const ZIP_ENDPOINT = 'https://storage.googleapis.com/'

export const downloadReportGoogleplay = async (token: any, uri: string, month: number, year: number): Promise<string> => {
    try {
        const accessToken = await getToken()
        const bearer = `Bearer ${accessToken}`

        logger.info('Getting the report list', { uri, month, year })
        const reportList = await getReportList(bearer, uri, month, year)

        logger.info('Getting the right report from the list', { month, year })
        const reportUri = getReportUriFromList(reportList, uri, month, year)

        logger.info('Downloading the zip and getting the path', { reportUri })
        const reportZipPath = await downloadZipAndGetPath(bearer, reportUri)
        
        logger.info('Unzipping the report', { reportZipPath })
        const csvContent = await unzipFileAndGetContent(reportZipPath)

        logger.info('Deleting zip file', { reportZipPath })
        await deleteZipFile(reportZipPath)

        return csvContent
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleDownloadError, 'Could not download Google play reports', true, true, { uri, month, year }, err)
    }
}

export const getReportList = async (bearer: string, uri: string, month: number, year: number): Promise<string> => {
    try {
        const MONTH_NUMBER_WITH_2_FIGURES = 10
        const stringMonth = month < MONTH_NUMBER_WITH_2_FIGURES ? `0${month}` : month
        const reportListResponse = await fetch(`${API_ENDPOINT_HOST}${uri}${API_ENDPOINT_ALL_REPORTS}?startOffset=earnings/earnings_${year}${stringMonth}`, {
            headers: {'Authorization': bearer}
        })
        const reportListJson = await reportListResponse.json()
        return reportListJson.items
    }
    catch (err) {
        throw new AppError(errorTypes.NotFoundError, appErrorTypes.GoogleDownloadError, 'No report available for this date', true, true, { uri }, err)
    }
}

const getReportUriFromList = (reportList: any, uri: string, month: number, year: number): string => {
    try {
        const MONTH_NUMBER_WITH_2_FIGURES = 10
        const stringMonth = month < MONTH_NUMBER_WITH_2_FIGURES ? `0${month}` : month
        const reportsFiltered = reportList.filter((report: any) => {
            return report.name.includes(`earnings_${year}${stringMonth}`)
        })

        // injection protected because constant
        const report = reportsFiltered[0] // eslint-disable-line
        return ZIP_ENDPOINT + uri + '/' + report.name
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleDownloadError, 'Could not get the right report from the list', true, true, { uri, month, year }, err)
    }
}

const downloadZipAndGetPath = async (bearer: string, uri: string): Promise<string> => {
    try {
        const OFFSET = 1
        const fileName = uri.split('/')[uri.split('/').length - OFFSET]
        await downloadFile(uri, fileName, bearer)
        return FILE_DIRECTORY + fileName
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleDownloadError, 'Could not download the zip from Google', true, true, { uri }, err)
    }
}

const unzipFileAndGetContent = async (file: string): Promise<string> => {
    try {
        const zip = new AdmZip(file)
        const zipEntries = zip.getEntries()
        let data = ''

        for (let zipEntry of zipEntries) {
            data = data + zipEntry.getData().toString('utf8')
        }

        return data
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleDownloadError, 'Could not unzip report', true, true, {}, err)
    }
}

const deleteZipFile = async (file: string): Promise<void> => {
    try {
        fs.unlinkSync(file) // eslint-disable-line
    }
    catch (err) {
        throw new AppError(errorTypes.Error, appErrorTypes.GoogleDownloadError, 'Could not delete zip file', true, true, {}, err)
    }
}