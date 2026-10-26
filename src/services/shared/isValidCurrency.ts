const isValidCurrency = (currencyName: string): boolean => {
    const regex = RegExp('^[A-Za-z]{3}$')
    return regex.test(currencyName)
}

export default isValidCurrency
