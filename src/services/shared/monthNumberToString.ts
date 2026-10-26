const monthNumberToString = (month: number): string => {
    const OFFSET = 1
    const FIRST_DAY_OF_MONTH = 1
    const date = new Date()
    date.setDate(FIRST_DAY_OF_MONTH)
    date.setMonth(month - OFFSET)
    return date.toLocaleString('en-GB', { month: 'long' })
}

export default monthNumberToString