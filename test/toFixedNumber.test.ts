import toFixedNumber from '../src/services/shared/toFixedNumber'

describe('toFixedNumber(2.001)', () => {
    it('should return 2', () => {
        expect(toFixedNumber(2.001)).toBe(2) // eslint-disable-line
    })
})

describe('toFixedNumber(2.019)', () => {
    it('should return 2', () => {
        expect(toFixedNumber(2.019)).toBe(2.02) // eslint-disable-line
    })
})

describe('toFixedNumber(5.59)', () => {
    it('should return 5.59', () => {
        expect(toFixedNumber(5.59)).toBe(5.59) // eslint-disable-line
    })
})

describe('toFixedNumber(43.5986)', () => {
    it('should return 43.60', () => {
        expect(toFixedNumber(43.5986)).toBe(43.60) // eslint-disable-line
    })
})

describe('toFixedNumber(43.59146484)', () => {
    it('should return 43.59', () => {
        expect(toFixedNumber(43.59146484)).toBe(43.59) // eslint-disable-line
    })
})
