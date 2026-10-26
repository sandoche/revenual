import lsq from 'least-squares'
import logger from '../../../util/logger'


const getPredictions = (reports: any): any => {
    logger.info('Trying to get predictions', { reportsNumber: reports.length })
    const MIN_REPORTS = 3
    const FIRST_INDEX = 0
    const ONE_MONTH = 1
    const TWO_MONTHS = 2
    const MONTH_OFFSET = 1
    const LAST_DAY_OF_MONTH = 28

    const x = []
    const y = []
    const predictions = []
  
    let lastMonth
    let lastYear
    let lastEarning
    let lastDate

    if (reports.length < MIN_REPORTS) {
        return null
    }
    
    for (let i = 0; i < MIN_REPORTS; i++) {
        logger.info('Getting predictions')
        const report = reports[i] // eslint-disable-line
        const currentX = new Date().setFullYear(report.report_data.year, report.report_data.month - MONTH_OFFSET, LAST_DAY_OF_MONTH)
        const currentY = report.earnings

        x.push(currentX)
        y.push(currentY)

        if (i === FIRST_INDEX) {
            lastDate = new Date().setFullYear(report.report_data.year, report.report_data.month - MONTH_OFFSET, LAST_DAY_OF_MONTH)
            lastYear = report.report_data.year
            lastMonth = report.report_data.month
            lastEarning = report.earnings
        }
    }

    let ret = {}
    const f = lsq(x, y, ret)

    predictions.push({
        date: lastMonth + '/' + lastYear,
        earning: lastEarning
    })

    const dateMplusOne = new Date(lastDate).setMonth(new Date(lastDate).getMonth() + ONE_MONTH)

    predictions.push({
        date: `${new Date(dateMplusOne).getMonth() + MONTH_OFFSET}/${new Date(dateMplusOne).getFullYear()}`,
        earning: f(dateMplusOne)
    })

    const dateMplusTwo = new Date(lastDate).setMonth(new Date(lastDate).getMonth() + TWO_MONTHS)
    predictions.push({
        date: `${new Date(dateMplusTwo).getMonth() + MONTH_OFFSET}/${new Date(dateMplusTwo).getFullYear()}`,
        earning: f(dateMplusTwo)
    })

    return predictions
}

export default getPredictions
