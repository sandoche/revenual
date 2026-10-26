const appErrors = {
    GenericError: {
        code: 0,
        message: 'Sorry, an error occured, please try again'
    },
    ExistingAccount: {
        code: 1,
        message: 'Sorry, this account has already been added'
    },
    FileNotFound: {
        code: 2,
        message: 'The uploaded file is invalid'
    },
    TokenRefreshError: {
        code: 3,
        message: 'Sorry, we could not refresh tokens'
    },
    AppleTokenError: {
        code: 4,
        message: 'Sorry, we could not refresh apple\'s token, please try to delete and add the account again'
    },
    GoogleTokenError: {
        code: 5,
        message: 'Sorry, we could not refresh google play\'s token, please try to delete and add the account again'
    },
    AppleCredentialsError: {
        code: 6,
        message: 'Your credentials may be incorrect'
    },
    ReportError: {
        code: 7,
        message: 'Sorry, we could not get the report information'
    },
    ExchangeRateError: {
        code: 8,
        message: 'Sorry, we could not find the currency conversion rate of one of your sales'
    },
    ExchangeCsvError: {
        code: 9,
        message: 'Sorry, we could not get the exchanges from your CSV'
    },
    ExchangeUpdateError: {
        code: 10,
        message: 'Sorry, we could not update your earning\'s exchanges'
    },
    InvoiceGenerationError: {
        code: 11,
        message: 'Sorry, we could not generate this invoice'
    },
    AppleParsingError: {
        code: 12,
        message: 'Sorry, an error occured while analyzing Apple\'s sales'
    },
    GoogleParsingError: {
        code: 13,
        message: 'Sorry, an error occured while analyzing Google\'s sales'
    },
    AppleDownloadError: {
        code: 14,
        message: 'Sorry, an error occured while analyzing Apple\'s sales'
    },
    GoogleDownloadError: {
        code: 15,
        message: 'Sorry, an error occured while analyzing Google\'s sales'
    },
    GoogleInvalidUri: {
        code: 16,
        message: 'The URL provided is invalid, please try again'
    },
    ExpiredAccount: {
        code: 17,
        message: 'Sorry, one of your account has expired'
    },
    ExistingReport: {
        code: 18,
        message: 'Sorry, this report has already exist'
    },
    ReportGenerationError: {
        code: 19,
        message: 'Sorry, we could not generate this report'
    },
    CSVMissingError: {
        code: 20,
        message: 'Sorry, we did not receive any CSV file'
    },
    AccountRequired: {
        code: 21,
        message: 'Sorry, you need at least one account to generate a report'
    },
}

export default appErrors