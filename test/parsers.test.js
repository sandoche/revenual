const mongoose = require('mongoose')
const { parseReportAppstore } = require('../src/services/reports/utils/parseReportAppstore')
const { parseReportGoogleplay } = require('../src/services/reports/utils/parseReportGoogleplay')
const { parseUri } = require('../src/services/shared/googleplayUriParser')

const account = new mongoose.Types.ObjectId()
const report = { _id: new mongoose.Types.ObjectId(), user: new mongoose.Types.ObjectId() }
const rowsWithEarnings = rows => rows.filter(row => row.providerType)

function appleRow({ units, share, proceeds, price, kind, currency = 'EUR' }) {
    const row = Array(22).fill('')
    Object.assign(row, { 0: '01/05/2025', 1: '02/01/2025', 4: 'com.example.demo', 5: units,
        6: share, 7: proceeds, 8: currency, 9: kind, 10: '1000000000', 12: 'Demo product',
        17: 'FR', 20: price, 21: currency })
    return row.join('\t')
}

test('Apple synthetic sales/refunds preserve fees and currency conversion', async () => {
    const getExchangeRate = jest.fn(async () => 2)
    const container = { resolve: () => ({ getExchangeRate }) }
    const data = [appleRow({ units: 2, share: 7, proceeds: 14, price: 10, kind: 'S' }),
        appleRow({ units: -1, share: 7, proceeds: -7, price: -10, kind: 'R' })].join('\n')
    const rows = rowsWithEarnings(await parseReportAppstore(container, data, 'USD', account, 'demo@example.invalid', report, 2025, 1))
    expect(rows).toHaveLength(2)
    expect(rows[0].unitFeeMerchantCurrency).toBe(-6)
    expect(rows[0].totalEarningMerchantCurrency).toBe(28)
    expect(rows[1].isRefund).toBe(true)
    expect(rows[1].totalEarningMerchantCurrency).toBe(-14)
    expect(getExchangeRate).toHaveBeenCalledTimes(2)
    expect(await parseReportAppstore(container, null, 'USD', account, '', report, 2025, 1)).toEqual([])
})

function googleRow(id, type, amount) {
    const row = Array(19).fill('')
    Object.assign(row, { 0: id, 1: 'Jan 05, 2025', 2: '12:00:00 PM', 4: type, 6: 'Demo, product',
        9: 'com.example.demo', 11: 'US', 14: 'USD', 15: amount, 16: 1, 17: 'USD', 18: amount })
    return row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')
}

test('Google synthetic charges combine their fees and taxes, with a separate refund', async () => {
    const data = [googleRow('demo-order-1', 'Charge', 20), googleRow('demo-order-1', 'Google fee', -6),
        googleRow('demo-order-1', 'Tax', -2), googleRow('demo-order-2', 'Charge refund', -8),
        googleRow('demo-order-2', 'Google fee refund', 2.4)].join('\n')
    const rows = rowsWithEarnings(await parseReportGoogleplay(data, 'USD', account, 'demo-bucket', report, 2025, 1))
    // The legacy parser returns the same document for a charge, fee and tax.
    const unique = [...new Map(rows.map(row => [row.transactionId, row])).values()]
    expect(unique).toHaveLength(2)
    expect(unique[0].totalEarningMerchantCurrency).toBe(12)
    expect(unique[0].productTitle).toBe('Demo, product')
    expect(unique[1].units).toBe(-1)
    expect(unique[1].totalEarningMerchantCurrency).toBeCloseTo(-5.6)
    expect(await parseReportGoogleplay(null, 'USD', account, '', report, 2025, 1)).toEqual([])
})

test('Google bucket parser accepts synthetic URIs and rejects unrelated URLs', () => {
    for (const suffix of ['', '/', '/earnings/', '/sales/']) {
        expect(parseUri('gs://pubsite_prod_rev_00000000000000000000' + suffix)).toBe('pubsite_prod_rev_00000000000000000000')
    }
    expect(() => parseUri('https://example.invalid')).toThrow()
})
