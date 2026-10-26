# Data Model

## 1. User
- email
- accounts (2) / OneToMany
- reports (3) / OneToMany
- earnings (5) / OneToMany

## 2. Account
- type
- credentials
- createdAt

## 3. Report
- createdAt
- year
- month
- status
- user (1)
- providerReport (4) / OneToMany
- earnings (5) / OneToMany

## 4. ProviderReport
- createdAt
- year
- month
- data
- account (2)
- report (3)

## 5. Earning
- user (1)
- report (3)
- account (2)
- accountId // in case account is deleted for information
- provider / providerType
- createdAt
- year
- month
- transactionDate
- productTitle
- productId
- units
- countryCode
- buyerCurrency
- exchangeRate
- merchantCurrency
- unitSalePriceBuyerCurrency
- unitComissionPriceBuyerCurrency
- totalEarningBuyerCurrency
- unitSalePriceMerchantCurrency
- unitComissionMerchantCurrency
- totalEarningMerchantCurrency
- exhangeRateUpdateDate



