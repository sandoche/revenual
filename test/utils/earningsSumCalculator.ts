import { EarningDocument } from '../../src/models/Earning'

const sumCalculator = (sum: any, earning: EarningDocument): any => { // eslint-disable-line
    if(!sum.map[earning._id] && earning.units) {
        sum.units = sum.units + earning.units
        sum.sales = sum.sales + earning.unitSalePriceMerchantCurrency * Math.abs(earning.units)
        sum.fees = sum.fees + earning.unitFeeMerchantCurrency * Math.abs(earning.units)
        sum.taxes = sum.taxes + earning.unitTaxMerchantCurrency * Math.abs(earning.units)
        sum.earnings = sum.earnings + earning.totalEarningMerchantCurrency
        sum.map[earning._id] = earning._id
    }
    return sum
}

export default sumCalculator