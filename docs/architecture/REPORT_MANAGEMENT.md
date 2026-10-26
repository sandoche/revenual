# Report management

## Functions
getReportableAccount(account)
getParsableReport(report)
getPresentableReport(report)

## Interfaces
- ReportableAccount.ts
  - credentials
  - .download()
- ParsableReport.ts
  - data
  - parseReport()
  - getSales()
- PresentableEarnings(earnings)
  - earnings
  - month
  - year
  - total
  - byProduct
  - byProvider
  - byCountry

## Classes
- ReportableGoogleplay
- ReportableAppstore
- ParsableReportGoogleplay
- ParsableReportAppstore
- PresentableEarningsGoogleplay
- PresentableEarningsAppstore

## Utils
- getExchangeRate()
- parseAppstoreResults()
- parseGoogleplayResults()